// The closed set of flow colors (see src/routes/layout.css @theme). Kept
// closed rather than a free-form picker so every chart/badge in the app
// draws from the same coherent palette no matter how many flows a user adds.
export const FLOW_COLOR_TOKENS = ['gold', 'channel', 'clay', 'sage', 'plum', 'mist'] as const;

export type FlowColorToken = (typeof FLOW_COLOR_TOKENS)[number];

export function flowColorVar(color: string | null): string {
	const token = color && (FLOW_COLOR_TOKENS as readonly string[]).includes(color) ? color : 'mist';
	return `var(--color-${token})`;
}
