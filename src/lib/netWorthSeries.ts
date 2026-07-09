export type BalanceSnapshotRow = {
	account_id: string;
	as_of_date: string;
	current_balance: number;
};

export type NetWorthPoint = { date: string; netWorth: number };

// Net worth "as of" any given date requires each account's most recent
// snapshot on or before that date (accounts aren't snapshotted in lockstep —
// a manual account might get one update a month while a linked one syncs
// daily). Carries the last known balance forward per account across the
// unioned set of dates any account was actually snapshotted on.
export function computeNetWorthSeries(
	snapshots: BalanceSnapshotRow[],
	isAssetByAccount: Map<string, boolean>
): NetWorthPoint[] {
	const byAccount = new Map<string, BalanceSnapshotRow[]>();
	for (const snapshot of snapshots) {
		const list = byAccount.get(snapshot.account_id) ?? [];
		list.push(snapshot);
		byAccount.set(snapshot.account_id, list);
	}
	for (const list of byAccount.values()) {
		list.sort((a, b) => a.as_of_date.localeCompare(b.as_of_date));
	}

	const dates = [...new Set(snapshots.map((s) => s.as_of_date))].sort();

	return dates.map((date) => {
		let netWorth = 0;
		for (const [accountId, list] of byAccount) {
			let latest: BalanceSnapshotRow | undefined;
			for (const snapshot of list) {
				if (snapshot.as_of_date <= date) latest = snapshot;
				else break;
			}
			if (latest) {
				const isAsset = isAssetByAccount.get(accountId) ?? true;
				netWorth += isAsset ? latest.current_balance : -latest.current_balance;
			}
		}
		return { date, netWorth };
	});
}
