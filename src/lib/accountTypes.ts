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

// Plaid subtypes we don't already have a curated label for (our own manual
// account picker doesn't offer these, but linked institutions can return
// them freely — cd, hsa, and money market read oddly under naive title-case).
const SUBTYPE_LABEL_OVERRIDES: Record<string, string> = {
	cd: 'CD',
	hsa: 'HSA',
	ira: 'IRA',
	'money market': 'Money Market',
	'cash management': 'Cash Management',
	'401k': '401(k)',
	'401a': '401(a)',
	'403b': '403(b)',
	'457b': '457(b)'
};

function titleCase(value: string): string {
	return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function accountTypeLabel(type: string, subtype: string | null): string {
	const curated = ACCOUNT_TYPE_OPTIONS.find((o) => o.type === type && o.subtype === subtype);
	if (curated) return curated.label;
	if (!subtype) return titleCase(type);
	return SUBTYPE_LABEL_OVERRIDES[subtype] ?? titleCase(subtype);
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
