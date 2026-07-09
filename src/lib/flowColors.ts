// The closed set of flow colors (see src/routes/layout.css @theme). Kept
// closed rather than a free-form picker so every chart/badge in the app
// draws from the same coherent palette no matter how many flows a user adds.
export const FLOW_COLOR_TOKENS = ['gold', 'channel', 'clay', 'sage', 'plum', 'mist'] as const;

export type FlowColorToken = (typeof FLOW_COLOR_TOKENS)[number];

export function flowColorVar(color: string | null): string {
	const token = color && (FLOW_COLOR_TOKENS as readonly string[]).includes(color) ? color : 'mist';
	return `var(--color-${token})`;
}

// Chart-specific palette, validated with the dataviz skill's
// scripts/validate_palette.js (chroma floor, CVD adjacent-pair separation,
// lightness band all PASS). The brand tokens above are muted by design and
// only used for chrome (nav dots, badges) that's always paired with an
// adjacent text label — that's fine for identity-only accents, but a chart
// with several competing series needs more saturated, better-separated
// marks. Keyed by flow slug so the 5 default flows that actually compete in
// the flow-allocation chart get validated colors; Transfers is excluded from
// totals and essentially never appears as an active series, so it keeps a
// plain neutral gray rather than forcing a 6th hue into the validated set.
const FLOW_CHART_COLORS: Record<string, string> = {
	income: '#eda100',
	fixed_essential: '#2a78d6',
	discretionary_goals: '#1baf7a',
	savings_investing: '#008300',
	debt_paydown: '#4a3aa7',
	transfers: '#8a8f98'
};

export function flowChartColor(flow: { slug?: string | null; color?: string | null }): string {
	if (flow.slug && FLOW_CHART_COLORS[flow.slug]) return FLOW_CHART_COLORS[flow.slug];
	return flowColorVar(flow.color ?? null);
}
