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

export interface VisualizerProps {
	visualizerRef?: Ref<any>;
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
	deltaTime: number;
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
	visualizerRef: canvasRef,
	class: className,
	media,
	paused,
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

			if (forceFrame || (paused?.value !== true && media.value?.context.state === "running")) {
				draw({
					...visualizerContext,
					data: data!,
					time,
					deltaTime: time - prevTime,
				});
				forceFrame = false;
				prevTime = time;
			}

			requestAnimationFrame(nextFrame);
		};

		requestAnimationFrame(nextFrame);
		return () => {
			destroyed = true;
			media.value?.source.disconnect(analyser);
		};
	});

	return <canvas class={className} ref={wrapRefs(canvas, canvasRef)} />;
}
