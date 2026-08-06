/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useSignalEffect, type Signal } from "@preact/signals";
import type { Ref } from "preact";
import { useEffect, useRef } from "preact/hooks";

import type { MediaContext } from "../../../../scripts/utils/audio";
import { autoResizeCanvas } from "../../../../scripts/utils/canvas/auto-resize";
import { wrapRefs } from "../../../../scripts/utils/preact";

/** The properties to pass to visualizer instances. */
export interface VisualizerProps {
	visualizerRef?: Ref<any>;
	class?: string;
	media: Signal<MediaContext | undefined>;
	paused?: Signal<boolean>;
	noPause?: boolean;
}

interface BaseVisualizerContext {
	/** The list of analyser(s) for this visualizer. */
	analysers: AnalyserNode[];

	/** The canvas context. */
	ctx: CanvasRenderingContext2D;

	/** The media context. */
	media: MediaContext;
}

/** The complete visualizer context for drawing. */
interface VisualizerContext<T = undefined> extends BaseVisualizerContext {
	/** The data context for this visualizer. */
	data: T;

	/** The current animation time in milliseconds. */
	time: number;

	/** The number of milliseconds since the last frame. */
	deltaTime: number;

	/** Whether the audio is currently playing. */
	running: boolean;
}

interface Props<T = undefined> extends VisualizerProps {
	/** If `true`, 2 analysers are created, one for each audio channel. */
	stereo?: boolean;

	/**
	 * Called when the visualizer is created. Here you can configure the analyser and prepare your
	 * data arrays.
	 */
	init?: (ctx: BaseVisualizerContext) => T;

	/** Called every frame while the visualizer is active. */
	draw: (ctx: VisualizerContext<T>) => void;
}

interface VisualizerTheme {
	/** The primary colour. */
	color: string;

	/** A gradient for the volume (from low to high). */
	gradient: string[];

	/** An alternative gradient for when the audio is clipping. */
	clippingGradient: string[];
}

export const visualizerThemes = {
	Lit: {
		color: "#ff3333",
		gradient: ["#dd1c28", "#ff2828", "#ff8f2b", "#ffef2f"],
		clippingGradient: ["#ffaa30", "#ffff40"],
	},
} satisfies Record<string, VisualizerTheme>;

/** A helper component for creating audio visualizers. */
export function AudioVisualizer<T = undefined>({
	visualizerRef,
	class: className,
	media,
	paused,
	noPause,
	stereo,
	init,
	draw,
}: Props<T>) {
	const canvas = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		if (!canvas.current) {
			return undefined;
		}

		return autoResizeCanvas(canvas.current, {
			onResize: ({ renderScale }) => {
				if (canvas.current) {
					canvas.current.dataset.renderScale = renderScale.toString();
				}
			},
		}).destroy;
	});

	useSignalEffect(() => {
		const ctx = canvas.current?.getContext("2d");
		if (!ctx || !media.value) {
			return undefined;
		}

		const analysers: AnalyserNode[] = [];
		let cleanup: () => void;
		if (stereo) {
			// Split the channels
			const splitter = media.value.context.createChannelSplitter(2);
			media.value.source.connect(splitter);

			// Send each channel to an analyser
			for (let i = 0; i < splitter.numberOfOutputs; i++) {
				const analyser = media.value.context.createAnalyser();
				splitter.connect(analyser, i);
				analysers.push(analyser);
			}

			cleanup = () => {
				media.value?.source.disconnect(splitter);
				splitter.disconnect();
			};
		} else {
			const analyser = media.value.context.createAnalyser();
			media.value.source.connect(analyser);
			analysers.push(analyser);

			cleanup = () => media.value?.source.disconnect(analyser);
		}

		const visualizerContext: BaseVisualizerContext = {
			analysers,
			ctx,
			media: media.value,
		};
		const data = init?.(visualizerContext);
		let prevWidth = ctx.canvas.width;
		let prevHeight = ctx.canvas.height;
		let destroyed = false;
		let forceFrame = true;
		let prevTime = 0;
		const nextFrame: FrameRequestCallback = (time) => {
			if (destroyed) {
				return;
			}

			const width = ctx.canvas.width;
			const height = ctx.canvas.height;
			if (width !== prevWidth || height !== prevHeight) {
				prevWidth = width;
				prevHeight = height;
				forceFrame = true;
			}

			const running = paused?.value !== true && media.value?.context.state === "running";
			if (forceFrame || noPause || running) {
				draw({
					...visualizerContext,
					data: data!,
					time,
					deltaTime: time - prevTime,
					running,
				});
				forceFrame = false;
				prevTime = time;
			}

			requestAnimationFrame(nextFrame);
		};

		requestAnimationFrame(nextFrame);
		return () => {
			destroyed = true;
			cleanup();
		};
	});

	return <canvas class={className} ref={wrapRefs(canvas, visualizerRef)} />;
}
