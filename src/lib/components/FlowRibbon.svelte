<script lang="ts">
	// Decorative motif: a single source splitting into channels, echoing the
	// app's core idea (income fanning out into flows). Drifts very slowly;
	// disabled entirely under prefers-reduced-motion.
	let { class: className = '' }: { class?: string } = $props();
</script>

<svg
	class={className}
	viewBox="0 0 600 400"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	aria-hidden="true"
>
	<g stroke-linecap="round" fill="none">
		<path
			class="ribbon-path"
			style="animation-delay: 0s"
			d="M -20 200 C 120 200, 160 60, 380 40"
			stroke="var(--color-gold)"
			stroke-width="2.5"
			opacity="0.55"
		/>
		<path
			class="ribbon-path"
			style="animation-delay: -3s"
			d="M -20 200 C 120 200, 160 130, 400 130"
			stroke="var(--color-channel)"
			stroke-width="2.5"
			opacity="0.55"
		/>
		<path
			class="ribbon-path"
			style="animation-delay: -6s"
			d="M -20 200 C 120 200, 170 200, 420 200"
			stroke="var(--color-clay)"
			stroke-width="2.5"
			opacity="0.55"
		/>
		<path
			class="ribbon-path"
			style="animation-delay: -9s"
			d="M -20 200 C 120 200, 170 270, 400 280"
			stroke="var(--color-sage)"
			stroke-width="2.5"
			opacity="0.55"
		/>
		<path
			class="ribbon-path"
			style="animation-delay: -12s"
			d="M -20 200 C 120 200, 160 340, 380 360"
			stroke="var(--color-plum)"
			stroke-width="2.5"
			opacity="0.55"
		/>
	</g>
</svg>

<style>
	.ribbon-path {
		stroke-dasharray: 6 10;
		animation: drift 18s linear infinite;
	}

	@keyframes drift {
		to {
			stroke-dashoffset: -160;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.ribbon-path {
			animation: none;
		}
	}
</style>
