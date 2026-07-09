import { merchantKey } from './plaid/categorize';

type RecurringInput = {
	name: string;
	merchant_name: string | null;
	merchant_entity_id: string | null;
	date: string;
	amount: number;
};

export type RecurringMerchant = {
	key: string;
	label: string;
	cadence: 'Weekly' | 'Biweekly' | 'Monthly' | 'Quarterly';
	averageAmount: number;
	monthlyEquivalent: number;
	lastDate: string;
	occurrences: number;
};

const CADENCE_BANDS: { min: number; max: number; label: RecurringMerchant['cadence']; perMonth: number }[] = [
	{ min: 6, max: 8, label: 'Weekly', perMonth: 4.33 },
	{ min: 13, max: 16, label: 'Biweekly', perMonth: 2.17 },
	{ min: 25, max: 35, label: 'Monthly', perMonth: 1 },
	{ min: 85, max: 95, label: 'Quarterly', perMonth: 1 / 3 }
];

function mean(values: number[]): number {
	return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stddev(values: number[], avg: number): number {
	return Math.sqrt(mean(values.map((v) => (v - avg) ** 2)));
}

// Merchant+amount+cadence heuristic: groups outflow transactions by merchant,
// requires >=3 occurrences whose day-to-day intervals fall in a known band
// (weekly/biweekly/monthly/quarterly) with low interval variance, and whose
// amounts are consistent within ~15%. No persisted "recurring_series" table —
// this recomputes on each dashboard load, which is cheap at personal scale
// and always reflects the latest data rather than a stale prior detection.
export function detectRecurringMerchants(transactions: RecurringInput[]): RecurringMerchant[] {
	const groups = new Map<string, RecurringInput[]>();
	for (const tx of transactions) {
		const key = merchantKey(tx);
		const list = groups.get(key) ?? [];
		list.push(tx);
		groups.set(key, list);
	}

	const results: RecurringMerchant[] = [];

	for (const [key, txs] of groups) {
		if (txs.length < 3) continue;
		const sorted = [...txs].sort((a, b) => a.date.localeCompare(b.date));

		const intervals: number[] = [];
		for (let i = 1; i < sorted.length; i++) {
			const days =
				(new Date(sorted[i].date).getTime() - new Date(sorted[i - 1].date).getTime()) / 86_400_000;
			intervals.push(days);
		}

		const avgInterval = mean(intervals);
		const intervalStddev = stddev(intervals, avgInterval);
		if (intervalStddev > avgInterval * 0.3 + 2) continue;

		const band = CADENCE_BANDS.find((b) => avgInterval >= b.min && avgInterval <= b.max);
		if (!band) continue;

		const amounts = sorted.map((t) => t.amount);
		const avgAmount = mean(amounts);
		if (avgAmount <= 0) continue;
		const amountStddev = stddev(amounts, avgAmount);
		if (amountStddev / avgAmount > 0.15) continue;

		const label = sorted[sorted.length - 1].merchant_name || sorted[sorted.length - 1].name;

		results.push({
			key,
			label,
			cadence: band.label,
			averageAmount: avgAmount,
			monthlyEquivalent: avgAmount * band.perMonth,
			lastDate: sorted[sorted.length - 1].date,
			occurrences: sorted.length
		});
	}

	return results.sort((a, b) => b.monthlyEquivalent - a.monthlyEquivalent);
}
