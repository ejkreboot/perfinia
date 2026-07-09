// Shared taxonomy for manual and (later) Plaid-linked accounts: `type` groups
// accounts into the same sections a linked institution would produce, so the
// UI treats both sources uniformly once Plaid Link lands in Phase 3.
export type AccountTypeOption = {
	type: string;
	subtype: string;
	label: string;
	isAsset: boolean;
};

export const ACCOUNT_TYPE_OPTIONS: AccountTypeOption[] = [
	{ type: 'depository', subtype: 'checking', label: 'Checking', isAsset: true },
	{ type: 'depository', subtype: 'savings', label: 'Savings', isAsset: true },
	{ type: 'investment', subtype: 'brokerage', label: 'Brokerage / Investment', isAsset: true },
	{ type: 'investment', subtype: 'retirement', label: 'Retirement (401k / IRA)', isAsset: true },
	{ type: 'other_asset', subtype: 'real_estate', label: 'Property / Real Estate', isAsset: true },
	{ type: 'other_asset', subtype: 'vehicle', label: 'Vehicle', isAsset: true },
	{ type: 'other_asset', subtype: 'other', label: 'Other Asset', isAsset: true },
	{ type: 'credit', subtype: 'credit_card', label: 'Credit Card', isAsset: false },
	{ type: 'loan', subtype: 'mortgage', label: 'Mortgage', isAsset: false },
	{ type: 'loan', subtype: 'student', label: 'Student Loan', isAsset: false },
	{ type: 'loan', subtype: 'auto', label: 'Auto Loan', isAsset: false },
	{ type: 'loan', subtype: 'personal', label: 'Personal Loan', isAsset: false },
	{ type: 'other_liability', subtype: 'other', label: 'Other Liability', isAsset: false }
];

export function accountTypeLabel(type: string, subtype: string | null): string {
	return ACCOUNT_TYPE_OPTIONS.find((o) => o.type === type && o.subtype === subtype)?.label ?? type;
}

const GROUP_LABELS: Record<string, string> = {
	depository: 'Cash',
	credit: 'Credit',
	investment: 'Investment',
	loan: 'Loans',
	other_asset: 'Other Assets',
	other_liability: 'Other Liabilities'
};

export function accountGroupLabel(type: string): string {
	return GROUP_LABELS[type] ?? 'Other';
}

const GROUP_ORDER = [
	'depository',
	'investment',
	'other_asset',
	'credit',
	'loan',
	'other_liability'
];

export function accountGroupOrder(type: string): number {
	const index = GROUP_ORDER.indexOf(type);
	return index === -1 ? GROUP_ORDER.length : index;
}
