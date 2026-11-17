/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import clsx from "clsx";
import type { ComponentChildren, RefObject } from "preact";
import { useRef, useState } from "preact/hooks";

import { useEventTarget } from "../../../../../scripts/utils/preact";

import styles from "./ResizeHandle.module.scss";

interface ResizeHandleProps<T extends HTMLElement> {
	target:
		| RefObject<T | null>
		| ((xDst: number, yDst: number, horizontal: number, vertical: number) => void);
	position?: ResizeHandlePosition;
	onStartStop?: (resizing: boolean) => void;
	children?: ComponentChildren;
}

export type ResizeHandlePosition = keyof typeof resizeHandlePositions;

interface ResizeHandlePositionInfo {
	vertical: 0 | 50 | 100;
	horizontal: 0 | 50 | 100;
}

const resizeHandlePositions = {
	"top-left": {
		vertical: 0,
		horizontal: 0,
	},
	top: {
		vertical: 0,
		horizontal: 50,
	},
	"top-right": {
		vertical: 0,
		horizontal: 100,
	},
	left: {
		vertical: 50,
		horizontal: 0,
	},
	right: {
		vertical: 50,
		horizontal: 100,
	},
	"bottom-left": {
		vertical: 100,
		horizontal: 0,
	},
	bottom: {
		vertical: 100,
		horizontal: 50,
	},
	"bottom-right": {
		vertical: 100,
		horizontal: 100,
	},
} satisfies Record<string, ResizeHandlePositionInfo>;

// oxlint-disable-next-line typescript/no-unsafe-type-assertion
export const allResizeHandlePositions = Object.keys(
	resizeHandlePositions,
) as unknown as ResizeHandlePosition[];

export function getResizeHandleCursor(position: ResizeHandlePosition) {
	const { horizontal, vertical } = resizeHandlePositions[position];
	let cursor: string;

	if (vertical === 50) {
		cursor = "ew-resize";
	} else if (horizontal === 50) {
		cursor = "ns-resize";
	} else {
		cursor = horizontal === vertical ? "nwse-resize" : "nesw-resize";
	}

	return `url("/cursors/cyan_${cursor}.cur"), ${cursor}`;
}

export function ResizeHandle<T extends HTMLElement>({
	target,
	position = "bottom-right",
	onStartStop,
	children,
}: ResizeHandleProps<T>) {
	const [dragging, setDragging] = useState(false);
	const prevPos = useRef<[x: number, y: number]>([0, 0]);

	const { horizontal, vertical } = resizeHandlePositions[position];
	const cursor = getResizeHandleCursor(position);

	useEventTarget(
		() => window,
		(on) => {
			on("pointermove", (ev) => {
				if (!dragging) {
					return;
				}

				// For me, movementX/Y is more reliable on mobile, but it has issues with the cursor going
				// outside the window on PC. This should give us the best of both worlds.
				// BUG: Resizing is still messed up when not at 100% zoom, though...
				const noMovement = ev.movementX === 0 && ev.movementY === 0;
				let xDst = noMovement ? ev.clientX - prevPos.current[0] : ev.movementX;
				let yDst = noMovement ? ev.clientY - prevPos.current[1] : ev.movementY;

				xDst *= (horizontal - 50) / 50;
				yDst *= (vertical - 50) / 50;
				prevPos.current = [ev.clientX, ev.clientY];

				if (typeof target === "function") {
					return target(xDst, yDst, horizontal, vertical);
				} else if (target.current) {
					const width = target.current.offsetWidth;
					const height = target.current.offsetHeight;
					target.current.style.width = `${width + xDst}px`;
					target.current.style.height = `${height + yDst}px`;
				}
			});

			const stopDragging = () => {
				if (dragging) {
					setDragging(false);
					document.documentElement.style.cursor = "";
					onStartStop?.(false);
				}
			};

			on("pointerup", stopDragging);
			on("pointercancel", stopDragging);
		},
	);

	return (
		<div
			class={clsx("resize-handle", position, styles["resize-handle"])}
			onPointerDown={(ev) => {
				if (ev.button === 0) {
					setDragging(true);
					prevPos.current = [ev.clientX, ev.clientY];
					document.documentElement.style.cursor = cursor;
					onStartStop?.(true);
				}
			}}
			style={{
				top: `${vertical}%`,
				left: `${horizontal}%`,
				transform: `translate(${-horizontal}%, ${-vertical}%)`,
				width: horizontal === 50 ? "calc(100% - 2em)" : "1em",
				height: vertical === 50 ? "calc(100% - 2em)" : "1em",
				cursor,
			}}
		>
			{children}
		</div>
	);
}
