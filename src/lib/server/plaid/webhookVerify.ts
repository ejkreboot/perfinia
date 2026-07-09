import { createHash } from 'node:crypto';
import { importJWK, jwtVerify, type JWK, type CryptoKey } from 'jose';
import { plaidClient } from './client';

const MAX_WEBHOOK_AGE_SECONDS = 5 * 60;

// Plaid signs webhooks with an ES256 JWT in the Plaid-Verification header.
// Verification keys are keyed by `kid` and effectively immutable, so an
// in-memory cache avoids a verification-key fetch on every webhook.
const keyCache = new Map<string, CryptoKey | Uint8Array>();

async function getVerificationKey(keyId: string): Promise<CryptoKey | Uint8Array> {
	const cached = keyCache.get(keyId);
	if (cached) return cached;

	const response = await plaidClient.webhookVerificationKeyGet({ key_id: keyId });
	const key = await importJWK(response.data.key as JWK, 'ES256');
	keyCache.set(keyId, key);
	return key;
}

// Verifies a Plaid webhook per https://plaid.com/docs/api/webhooks/webhook-verification/ —
// signature, freshness (rejects anything older than 5 minutes, guarding
// against replay), and that the signed body hash matches the raw body we
// actually received.
export async function verifyPlaidWebhook(
	rawBody: string,
	verificationHeader: string | null
): Promise<boolean> {
	if (!verificationHeader) return false;

	const [headerB64] = verificationHeader.split('.');
	if (!headerB64) return false;

	let keyId: string | undefined;
	try {
		const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
		keyId = header.kid;
	} catch {
		return false;
	}
	if (!keyId) return false;

	try {
		const key = await getVerificationKey(keyId);
		const { payload } = await jwtVerify(verificationHeader, key, { algorithms: ['ES256'] });

		const iat = payload.iat;
		if (!iat || Date.now() / 1000 - iat > MAX_WEBHOOK_AGE_SECONDS) return false;

		const bodyHash = createHash('sha256').update(rawBody).digest('hex');
		if (payload.request_body_sha256 !== bodyHash) return false;

		return true;
	} catch {
		return false;
	}
}
