<script lang="ts">
	import { formatCurrency, formatDate } from '$lib/format';
	import type { NetWorthPoint } from '$lib/netWorthSeries';

	let { points }: { points: NetWorthPoint[] } = $props();

	const width = 640;
	const height = 220;
	const padding = { top: 16, right: 12, bottom: 24, left: 12 };

	let hoverIndex = $state<number | null>(null);

	let scale = $derived.by(() => {
		const values = points.map((p) => p.netWorth);
		const min = Math.min(...values, 0);
		const max = Math.max(...values, 0);
		const span = max - min || 1;
		const innerWidth = width - padding.left - padding.right;
		const innerHeight = height - padding.top - padding.bottom;

		const x = (i: number) =>
			points.length > 1 ? padding.left + (i / (points.length - 1)) * innerWidth : padding.left;
		const y = (v: number) => padding.top + innerHeight - ((v - min) / span) * innerHeight;

		return { x, y, innerWidth, innerHeight };
	});

	let linePath = $derived(
		points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scale.x(i)} ${scale.y(p.netWorth)}`).join(' ')
	);

	let areaPath = $derived(
		points.length > 0
			? `${linePath} L ${scale.x(points.length - 1)} ${height - padding.bottom} L ${scale.x(0)} ${height - padding.bottom} Z`
			: ''
	);

	function handleMove(event: PointerEvent & { currentTarget: SVGRectElement }) {
		if (points.length === 0) return;
		const rect = event.currentTarget.getBoundingClientRect();
		const relX = ((event.clientX - rect.left) / rect.width) * width;
		let closest = 0;
		let closestDist = Infinity;
		for (let i = 0; i < points.length; i++) {
			const dist = Math.abs(scale.x(i) - relX);
			if (dist < closestDist) {
				closestDist = dist;
				closest = i;
			}
		}
		hoverIndex = closest;
	}
</script>

{#if points.length === 0}
	<div class="flex h-[220px] items-center justify-center text-sm text-ink/40">
		Net worth history will show up here once accounts have a few balance updates.
	</div>
{:else}
	<div class="relative">
		<svg viewBox="0 0 {width} {height}" class="w-full" role="img" aria-label="Net worth over time">
			<defs>
				<linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color="var(--color-gold)" stop-opacity="0.25" />
					<stop offset="100%" stop-color="var(--color-gold)" stop-opacity="0" />
				</linearGradient>
			</defs>

			<line
				x1={padding.left}
				y1={height - padding.bottom}
				x2={width - padding.right}
				y2={height - padding.bottom}
				stroke="var(--color-ink)"
				stroke-opacity="0.1"
			/>

			{#if areaPath}
				<path d={areaPath} fill="url(#netWorthFill)" />
			{/if}
			<path d={linePath} fill="none" stroke="var(--color-gold)" stroke-width="2" />

			{#if points.length === 1}
				<circle cx={scale.x(0)} cy={scale.y(points[0].netWorth)} r="3" fill="var(--color-gold)" />
			{/if}

			{#if hoverIndex !== null}
				<line
					x1={scale.x(hoverIndex)}
					y1={padding.top}
					x2={scale.x(hoverIndex)}
					y2={height - padding.bottom}
					stroke="var(--color-ink)"
					stroke-opacity="0.2"
				/>
				<circle
					cx={scale.x(hoverIndex)}
					cy={scale.y(points[hoverIndex].netWorth)}
					r="4"
					fill="var(--color-gold)"
					stroke="white"
					stroke-width="1.5"
				/>
			{/if}

			<text x={padding.left} y={height - 6} class="fill-ink/40 text-[10px]"
				>{formatDate(points[0].date)}</text
			>
			<text
				x={width - padding.right}
				y={height - 6}
				text-anchor="end"
				class="fill-ink/40 text-[10px]">{formatDate(points[points.length - 1].date)}</text
			>

			<rect
				x="0"
				y="0"
				width={width}
				height={height}
				fill="transparent"
				role="presentation"
				onpointermove={handleMove}
				onpointerleave={() => (hoverIndex = null)}
			/>
		</svg>

		{#if hoverIndex !== null}
			<div
				class="pointer-events-none absolute rounded-lg bg-ink px-3 py-1.5 text-xs whitespace-nowrap text-paper shadow-lg"
				style="left: {(scale.x(hoverIndex) / width) * 100}%; top: 0; transform: translate(-50%, -110%)"
			>
				<p class="font-medium">{formatCurrency(points[hoverIndex].netWorth)}</p>
				<p class="text-paper/60">{formatDate(points[hoverIndex].date)}</p>
			</div>
		{/if}
	</div>
{/if}
