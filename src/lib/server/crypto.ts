import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { PLAID_TOKEN_ENCRYPTION_KEY } from '$env/static/private';

const key = Buffer.from(PLAID_TOKEN_ENCRYPTION_KEY, 'base64');

export type EncryptedToken = {
	ciphertext: string;
	iv: string;
	tag: string;
};

// AES-256-GCM: 12-byte random IV per encryption, auth tag stored alongside
// the ciphertext so tampering is detectable on decrypt.
export function encryptToken(plaintext: string): EncryptedToken {
	const iv = randomBytes(12);
	const cipher = createCipheriv('aes-256-gcm', key, iv);
	const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
	const tag = cipher.getAuthTag();

	return {
		ciphertext: ciphertext.toString('base64'),
		iv: iv.toString('base64'),
		tag: tag.toString('base64')
	};
}

export function decryptToken({ ciphertext, iv, tag }: EncryptedToken): string {
	const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
	decipher.setAuthTag(Buffer.from(tag, 'base64'));
	const plaintext = Buffer.concat([
		decipher.update(Buffer.from(ciphertext, 'base64')),
		decipher.final()
	]);

	return plaintext.toString('utf8');
}
