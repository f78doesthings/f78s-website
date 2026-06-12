/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useSignalEffect, type Signal } from "@preact/signals";
import { useEffect, useRef } from "preact/compat";

import type { MediaContext } from "../../../../scripts/utils/audio";
import { autoResizeCanvas } from "../../../../scripts/utils/canvas";

export interface VisualizerProps {
	class?: string;
	media: Signal<MediaContext | undefined>;
	paused?: Signal<boolean>;
}

interface BaseVisualizerContext {
	analyser: AnalyserNode;
	ctx: CanvasRenderingContext2D;
	media: MediaContext;
}

interface VisualizerContext<T = undefined> extends BaseVisualizerContext {
	data: T;
	time: number;
}

interface Props<T = undefined> extends VisualizerProps {
	init?: (ctx: BaseVisualizerContext) => T;
	draw: (ctx: VisualizerContext<T>) => void;
}

export const visualizerColors = {
	Red: "#ff3333",
};

export const visualizerGradients = {
	Lit: ["#dd1c28", "#ff2828", "#ff8f2b", "#ffef2f"],
};

/** A helper component for creating audio visualizers. */
export function AudioVisualizer<T = undefined>({
	class: className,
	media,
	paused,
	init,
	draw,
}: Props<T>) {
	const ref = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		if (!ref.current) {
			return undefined;
		}

		return autoResizeCanvas(ref.current, {
			onResize: ({ renderScale }) => {
				if (ref.current) {
					ref.current.dataset.renderScale = renderScale.toString();
				}
			},
		});
	});

	useSignalEffect(() => {
		const ctx = ref.current?.getContext("2d");
		if (!ctx || !media.value) {
			return undefined;
		}

		const analyser = media.value.context.createAnalyser();
		media.value.source.connect(analyser);
		//analyser.connect(context.value.context.destination);

		const visualizerContext: BaseVisualizerContext = {
			analyser,
			ctx,
			media: media.value,
		};
		const data = init?.(visualizerContext);
		let prevWidth = ctx.canvas.width;
		let prevHeight = ctx.canvas.height;
		let destroyed = false;
		let forceFrame = true;
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

			if (forceFrame || (paused?.value !== true && media.value?.context.state === "running")) {
				draw({
					...visualizerContext,
					data: data!,
					time,
				});
				forceFrame = false;
			}

			requestAnimationFrame(nextFrame);
		};

		requestAnimationFrame(nextFrame);
		return () => {
			destroyed = true;
			media.value?.source.disconnect(analyser);
		};
	});

	return <canvas class={className} ref={ref} />;
}
