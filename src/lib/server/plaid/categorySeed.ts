// Default flows/categories created for every new user, and the mapping from
// Plaid's Personal Finance Category (PFC) taxonomy to our category set that
// seeds auto-categorization. See `seedDefaults.ts` for how this is applied,
// and `categorize.ts` for how it's used on every synced transaction.

export type FlowSeed = {
	slug: string;
	name: string;
	direction: 'inflow' | 'outflow';
	countsTowardTotals: boolean;
	sortOrder: number;
};

export const DEFAULT_FLOWS: FlowSeed[] = [
	{ slug: 'income', name: 'Income', direction: 'inflow', countsTowardTotals: true, sortOrder: 0 },
	{
		slug: 'fixed_essential',
		name: 'Fixed & Essential',
		direction: 'outflow',
		countsTowardTotals: true,
		sortOrder: 1
	},
	{
		slug: 'discretionary_goals',
		name: 'Discretionary & Goals',
		direction: 'outflow',
		countsTowardTotals: true,
		sortOrder: 2
	},
	{
		slug: 'savings_investing',
		name: 'Savings & Investing',
		direction: 'outflow',
		countsTowardTotals: true,
		sortOrder: 3
	},
	{
		slug: 'debt_paydown',
		name: 'Debt Paydown',
		direction: 'outflow',
		countsTowardTotals: true,
		sortOrder: 4
	},
	{
		// Internal money movement (card payments funded by tracked spend, ATM
		// withdrawals, account-to-account transfers) is excluded from totals so
		// it doesn't double-count against income/flow-out.
		slug: 'transfers',
		name: 'Transfers',
		direction: 'outflow',
		countsTowardTotals: false,
		sortOrder: 5
	}
];

export type CategorySeed = {
	slug: string;
	name: string;
	flowSlug: string;
	isSupplementalIncome?: boolean;
};

export const DEFAULT_CATEGORIES: CategorySeed[] = [
	// Income
	{ slug: 'salary_wages', name: 'Salary & Wages', flowSlug: 'income' },
	{
		slug: 'extra_shifts',
		name: 'Extra Shifts',
		flowSlug: 'income',
		isSupplementalIncome: true
	},
	{ slug: 'interest_dividends', name: 'Interest & Dividends', flowSlug: 'income' },
	{ slug: 'tax_refund', name: 'Tax Refund', flowSlug: 'income' },
	{ slug: 'other_income', name: 'Other Income', flowSlug: 'income' },

	// Fixed & Essential
	{ slug: 'mortgage_rent', name: 'Mortgage / Rent', flowSlug: 'fixed_essential' },
	{ slug: 'utilities', name: 'Utilities', flowSlug: 'fixed_essential' },
	{ slug: 'internet_cable_phone', name: 'Internet, Cable & Phone', flowSlug: 'fixed_essential' },
	{ slug: 'groceries', name: 'Groceries', flowSlug: 'fixed_essential' },
	{ slug: 'tuition_childcare', name: 'Tuition & Childcare', flowSlug: 'fixed_essential' },
	{ slug: 'insurance', name: 'Insurance', flowSlug: 'fixed_essential' },
	{ slug: 'healthcare', name: 'Healthcare', flowSlug: 'fixed_essential' },
	{ slug: 'auto_transport', name: 'Auto & Transportation', flowSlug: 'fixed_essential' },
	{ slug: 'gas_fuel', name: 'Gas & Fuel', flowSlug: 'fixed_essential' },
	{ slug: 'taxes', name: 'Taxes', flowSlug: 'fixed_essential' },
	{ slug: 'bank_fees', name: 'Bank Fees', flowSlug: 'fixed_essential' },

	// Discretionary & Goals
	{ slug: 'dining_out', name: 'Dining Out', flowSlug: 'discretionary_goals' },
	{ slug: 'coffee_snacks', name: 'Coffee & Snacks', flowSlug: 'discretionary_goals' },
	{ slug: 'entertainment', name: 'Entertainment', flowSlug: 'discretionary_goals' },
	{ slug: 'shopping', name: 'Shopping', flowSlug: 'discretionary_goals' },
	{ slug: 'travel', name: 'Travel', flowSlug: 'discretionary_goals' },
	{ slug: 'personal_care', name: 'Personal Care & Fitness', flowSlug: 'discretionary_goals' },
	{ slug: 'gifts_donations', name: 'Gifts & Donations', flowSlug: 'discretionary_goals' },
	{ slug: 'subscriptions', name: 'Subscriptions', flowSlug: 'discretionary_goals' },
	{ slug: 'hobbies', name: 'Hobbies & Recreation', flowSlug: 'discretionary_goals' },
	{ slug: 'pets', name: 'Pets', flowSlug: 'discretionary_goals' },
	{ slug: 'home_improvement', name: 'Home Improvement', flowSlug: 'discretionary_goals' },
	{
		slug: 'professional_services',
		name: 'Professional & Legal Services',
		flowSlug: 'discretionary_goals'
	},
	{ slug: 'misc_discretionary', name: 'Miscellaneous', flowSlug: 'discretionary_goals' },

	// Savings & Investing
	{ slug: 'retirement_savings', name: 'Retirement Savings', flowSlug: 'savings_investing' },
	{ slug: 'general_savings', name: 'General Savings', flowSlug: 'savings_investing' },
	{ slug: 'investments', name: 'Investments', flowSlug: 'savings_investing' },
	{
		slug: 'education_savings',
		name: 'Education Savings (529)',
		flowSlug: 'savings_investing'
	},

	// Debt Paydown
	{ slug: 'student_loan', name: 'Student Loan Payment', flowSlug: 'debt_paydown' },
	{ slug: 'car_loan', name: 'Car Loan Payment', flowSlug: 'debt_paydown' },
	{ slug: 'personal_loan', name: 'Personal Loan Payment', flowSlug: 'debt_paydown' },
	{ slug: 'credit_card_interest', name: 'Credit Card Interest', flowSlug: 'debt_paydown' },

	// Transfers (excluded from totals)
	{ slug: 'internal_transfer', name: 'Internal Transfer', flowSlug: 'transfers' },
	{ slug: 'credit_card_payment', name: 'Credit Card Payment', flowSlug: 'transfers' },
	{ slug: 'atm_cash', name: 'ATM / Cash Withdrawal', flowSlug: 'transfers' }
];

// Plaid Personal Finance Category (PFCv1) detailed category -> our category
// slug. https://plaid.com/docs/api/products/transactions/#personal-finance-category
export const PFC_CATEGORY_MAP: Record<string, string> = {
	// Income
	INCOME_DIVIDENDS: 'interest_dividends',
	INCOME_INTEREST_EARNED: 'interest_dividends',
	INCOME_RETIREMENT_PENSION: 'salary_wages',
	INCOME_TAX_REFUND: 'tax_refund',
	INCOME_UNEMPLOYMENT: 'other_income',
	INCOME_WAGES: 'salary_wages',
	INCOME_OTHER_INCOME: 'other_income',

	// Transfers in
	TRANSFER_IN_CASH_ADVANCES_AND_LOANS: 'internal_transfer',
	TRANSFER_IN_DEPOSIT: 'internal_transfer',
	TRANSFER_IN_INVESTMENT_AND_RETIREMENT_FUNDS: 'internal_transfer',
	TRANSFER_IN_SAVINGS: 'internal_transfer',
	TRANSFER_IN_ACCOUNT_TRANSFER: 'internal_transfer',
	TRANSFER_IN_OTHER_TRANSFER_IN: 'internal_transfer',

	// Transfers out
	TRANSFER_OUT_INVESTMENT_AND_RETIREMENT_FUNDS: 'internal_transfer',
	TRANSFER_OUT_SAVINGS: 'internal_transfer',
	TRANSFER_OUT_WITHDRAWAL: 'atm_cash',
	TRANSFER_OUT_ACCOUNT_TRANSFER: 'internal_transfer',
	TRANSFER_OUT_OTHER_TRANSFER_OUT: 'internal_transfer',

	// Loan payments — credit card payment is a transfer (avoids double-counting
	// spend already categorized when the original purchases posted); genuine
	// amortizing loans go to Debt Paydown. Mortgage is treated as a fixed bill.
	LOAN_PAYMENTS_CAR_PAYMENT: 'car_loan',
	LOAN_PAYMENTS_CREDIT_CARD_PAYMENT: 'credit_card_payment',
	LOAN_PAYMENTS_PERSONAL_LOAN_PAYMENT: 'personal_loan',
	LOAN_PAYMENTS_MORTGAGE_PAYMENT: 'mortgage_rent',
	LOAN_PAYMENTS_STUDENT_LOAN_PAYMENT: 'student_loan',
	LOAN_PAYMENTS_OTHER_PAYMENT: 'personal_loan',

	// Bank fees
	BANK_FEES_ATM_FEES: 'bank_fees',
	BANK_FEES_FOREIGN_TRANSACTION_FEES: 'bank_fees',
	BANK_FEES_INSUFFICIENT_FUNDS: 'bank_fees',
	BANK_FEES_INTEREST_CHARGE: 'credit_card_interest',
	BANK_FEES_OVERDRAFT_FEES: 'bank_fees',
	BANK_FEES_OTHER_BANK_FEES: 'bank_fees',

	// Entertainment
	ENTERTAINMENT_CASINOS_AND_GAMBLING: 'entertainment',
	ENTERTAINMENT_MUSIC_AND_AUDIO: 'subscriptions',
	ENTERTAINMENT_SPORTING_EVENTS_AMUSEMENT_PARKS_AND_MUSEUMS: 'entertainment',
	ENTERTAINMENT_TV_AND_MOVIES: 'subscriptions',
	ENTERTAINMENT_VIDEO_GAMES: 'hobbies',
	ENTERTAINMENT_OTHER_ENTERTAINMENT: 'entertainment',

	// Food and drink
	FOOD_AND_DRINK_BEER_WINE_AND_LIQUOR: 'dining_out',
	FOOD_AND_DRINK_COFFEE: 'coffee_snacks',
	FOOD_AND_DRINK_FAST_FOOD: 'dining_out',
	FOOD_AND_DRINK_GROCERIES: 'groceries',
	FOOD_AND_DRINK_RESTAURANT: 'dining_out',
	FOOD_AND_DRINK_VENDING_MACHINES: 'coffee_snacks',
	FOOD_AND_DRINK_OTHER_FOOD_AND_DRINK: 'dining_out',

	// General merchandise
	GENERAL_MERCHANDISE_BOOKSTORES_AND_NEWSSTANDS: 'hobbies',
	GENERAL_MERCHANDISE_CLOTHING_AND_ACCESSORIES: 'shopping',
	GENERAL_MERCHANDISE_CONVENIENCE_STORES: 'shopping',
	GENERAL_MERCHANDISE_DEPARTMENT_STORES: 'shopping',
	GENERAL_MERCHANDISE_DISCOUNT_STORES: 'shopping',
	GENERAL_MERCHANDISE_ELECTRONICS: 'shopping',
	GENERAL_MERCHANDISE_GIFTS_AND_NOVELTIES: 'gifts_donations',
	GENERAL_MERCHANDISE_OFFICE_SUPPLIES: 'shopping',
	GENERAL_MERCHANDISE_ONLINE_MARKETPLACES: 'shopping',
	GENERAL_MERCHANDISE_PET_SUPPLIES: 'pets',
	GENERAL_MERCHANDISE_SPORTING_GOODS: 'hobbies',
	GENERAL_MERCHANDISE_SUPERSTORES: 'shopping',
	GENERAL_MERCHANDISE_TOBACCO_AND_VAPE: 'misc_discretionary',
	GENERAL_MERCHANDISE_OTHER_GENERAL_MERCHANDISE: 'shopping',

	// Home improvement
	HOME_IMPROVEMENT_FURNITURE: 'home_improvement',
	HOME_IMPROVEMENT_HARDWARE: 'home_improvement',
	HOME_IMPROVEMENT_REPAIR_AND_MAINTENANCE: 'home_improvement',
	HOME_IMPROVEMENT_SECURITY: 'home_improvement',
	HOME_IMPROVEMENT_OTHER_HOME_IMPROVEMENT: 'home_improvement',

	// Medical
	MEDICAL_DENTAL_CARE: 'healthcare',
	MEDICAL_EYE_CARE: 'healthcare',
	MEDICAL_NURSING_CARE: 'healthcare',
	MEDICAL_PHARMACIES_AND_SUPPLEMENTS: 'healthcare',
	MEDICAL_PRIMARY_CARE: 'healthcare',
	MEDICAL_VETERINARY_SERVICES: 'pets',
	MEDICAL_OTHER_MEDICAL: 'healthcare',

	// Personal care
	PERSONAL_CARE_GYMS_AND_FITNESS_CENTERS: 'personal_care',
	PERSONAL_CARE_HAIR_AND_BEAUTY: 'personal_care',
	PERSONAL_CARE_LAUNDRY_AND_DRY_CLEANING: 'personal_care',
	PERSONAL_CARE_OTHER_PERSONAL_CARE: 'personal_care',

	// General services
	GENERAL_SERVICES_ACCOUNTING_AND_FINANCIAL_PLANNING: 'professional_services',
	GENERAL_SERVICES_AUTOMOTIVE: 'auto_transport',
	GENERAL_SERVICES_CHILDCARE: 'tuition_childcare',
	GENERAL_SERVICES_CONSULTING_AND_LEGAL: 'professional_services',
	GENERAL_SERVICES_EDUCATION: 'tuition_childcare',
	GENERAL_SERVICES_INSURANCE: 'insurance',
	GENERAL_SERVICES_POSTAGE_AND_SHIPPING: 'misc_discretionary',
	GENERAL_SERVICES_STORAGE: 'misc_discretionary',
	GENERAL_SERVICES_OTHER_GENERAL_SERVICES: 'misc_discretionary',

	// Government and non-profit
	GOVERNMENT_AND_NON_PROFIT_DONATIONS: 'gifts_donations',
	GOVERNMENT_AND_NON_PROFIT_GOVERNMENT_DEPARTMENTS_AND_AGENCIES: 'taxes',
	GOVERNMENT_AND_NON_PROFIT_TAX_PAYMENT: 'taxes',
	GOVERNMENT_AND_NON_PROFIT_OTHER_GOVERNMENT_AND_NON_PROFIT: 'taxes',

	// Transportation
	TRANSPORTATION_BIKES_AND_SCOOTERS: 'auto_transport',
	TRANSPORTATION_GAS: 'gas_fuel',
	TRANSPORTATION_PARKING: 'auto_transport',
	TRANSPORTATION_PUBLIC_TRANSIT: 'auto_transport',
	TRANSPORTATION_TAXIS_AND_RIDE_SHARES: 'auto_transport',
	TRANSPORTATION_TOLLS: 'auto_transport',
	TRANSPORTATION_OTHER_TRANSPORTATION: 'auto_transport',

	// Travel
	TRAVEL_FLIGHTS: 'travel',
	TRAVEL_LODGING: 'travel',
	TRAVEL_RENTAL_CARS: 'travel',
	TRAVEL_OTHER_TRAVEL: 'travel',

	// Rent and utilities
	RENT_AND_UTILITIES_GAS_AND_ELECTRICITY: 'utilities',
	RENT_AND_UTILITIES_INTERNET_AND_CABLE: 'internet_cable_phone',
	RENT_AND_UTILITIES_RENT: 'mortgage_rent',
	RENT_AND_UTILITIES_SEWAGE_AND_WASTE_MANAGEMENT: 'utilities',
	RENT_AND_UTILITIES_TELEPHONE: 'internet_cable_phone',
	RENT_AND_UTILITIES_WATER: 'utilities',
	RENT_AND_UTILITIES_OTHER_UTILITIES: 'utilities'
};
