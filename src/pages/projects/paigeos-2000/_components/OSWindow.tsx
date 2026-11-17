/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import clsx from "clsx";
import { createContext, type ComponentChildren } from "preact";
import { useContext, useLayoutEffect, useRef, useState } from "preact/hooks";

import { useEventTarget } from "../../../../scripts/utils/preact";
import TitlebarButtons from "../assets/images/titlebar-buttons.webp";
import { OSContext } from "./OSApp";
import { Icon } from "./ui/Icon";
import {
	allResizeHandlePositions,
	ResizeHandle,
	type ResizeHandlePosition,
} from "./ui/ResizeHandle";

import styles from "./OSWindow.module.scss";

interface WindowContext {
	handle?: number;
}

export type WindowHandle = number;
export const WindowContext = createContext<WindowContext>({});

export interface WindowMetadata {
	icon?: Partial<ImageMetadata>;
	title?: string;
	isDialog?: boolean;
	draggable?: boolean;
	resizable?: boolean;
	initialSize?: [width: number, height: number];
	minSize?: [width: number, height: number];
	initialPosition?: [xPercent: number, yPercent: number];
	children?: ComponentChildren;
}

export interface WindowState extends WindowMetadata {
	handle: WindowHandle;
	minimized: boolean;
	dragState: boolean | ResizeHandlePosition;
	zIndex: number;
}

export interface WindowProps extends Partial<WindowState> {
	class?: string;
	focused?: boolean;
	onFocus?: (ev: PointerEvent) => void;
	onMinimize?: () => void;
	onClose?: () => void;
}

export function OSWindow({
	icon,
	title,
	isDialog,
	draggable = true,
	resizable = !isDialog,
	initialSize,
	minSize = [100, 100],
	initialPosition = [0.5, 0.5],
	children: content,
	focused = true,
	class: className,
	handle,
	minimized,
	zIndex,
	onClose,
	onMinimize,
	onFocus,
}: WindowProps) {
	const ctx = useContext(OSContext);

	const [maximized, setMaximized] = useState(false);
	const [dragState, setDragState] = useState(0);
	const [resizing, setResizing] = useState<ResizeHandlePosition>();
	const [x, setX] = useState<number>();
	const [y, setY] = useState<number>();
	const [width, setWidth] = useState(initialSize?.[0]);
	const [height, setHeight] = useState(initialSize?.[1]);

	const ref = useRef<HTMLDivElement>(null);
	const prevPos = useRef<[x: number, y: number]>([0, 0]);

	const isDragging = dragState !== 0 || resizing !== undefined;
	const windowContext: WindowContext = {
		handle,
	};

	useEventTarget(
		() => window,
		(on) => {
			if (!draggable) {
				return;
			}

			on("pointermove", (ev) => {
				if (dragState === 0 || !ref.current) {
					return;
				}

				const xDst = ev.clientX - prevPos.current[0];
				const yDst = ev.clientY - prevPos.current[1];

				if (dragState === 1) {
					const dst = Math.sqrt(xDst * xDst + yDst * yDst);
					if (dst < (maximized ? 8 : 4)) {
						return;
					}

					setDragState(2);
				}

				if (maximized) {
					setMaximized(false);
					setX(ev.clientX); // Actual value is set in the second useLayoutEffect below
					setY(yDst / innerHeight);
				} else {
					// Apparently I cannot use a callback function here or it breaks things (weird)
					setX((oldX) => (oldX ?? 0) + xDst / innerWidth);
					setY((oldY) => (oldY ?? 0) + yDst / innerHeight);
				}

				prevPos.current = [ev.clientX, ev.clientY];
			});

			on("pointerup", () => setDragState(0));
			on("pointercancel", () => setDragState(0));
		},
	);

	useLayoutEffect(() => {
		if (x === undefined && y === undefined && ref.current) {
			const desktop = document.querySelector(".desktop");
			const bounds = desktop?.getBoundingClientRect();
			setX(
				initialPosition[0] -
					(ref.current.offsetWidth * (1 - initialPosition[0])) / (bounds?.width ?? innerWidth),
			);
			setY(
				initialPosition[1] -
					(ref.current.offsetHeight * (1 - initialPosition[1])) / (bounds?.height ?? innerHeight),
			);
		}
	}, []);

	useLayoutEffect(() => {
		// We need to access the window size here, hence why it's wrapped in a useLayoutEffect
		if (!maximized && dragState !== 0 && ref.current && x !== undefined) {
			setX((x - ref.current.clientWidth * (x / innerWidth)) / innerWidth);
		}
	}, [maximized]);

	useLayoutEffect(() => {
		ctx?.setWindowDragState(handle, isDragging);
	}, [isDragging]);

	return (
		<WindowContext.Provider value={windowContext}>
			<div
				ref={ref}
				class={clsx(
					styles.window,
					maximized && styles.maximized,
					focused && styles.focused,
					minimized && styles.minimized,
					resizable && styles.resizable,
					className,
				)}
				style={{
					left: `${(x ?? 0) * 100}dvw`,
					top: `${(y ?? 0) * 100}dvh`,
					width: width && `${width / 16}rem`,
					height: height && `${height / 16}rem`,
					minWidth: `${minSize[0]}px`,
					minHeight: `${minSize[1]}px`,
					zIndex,
				}}
				onPointerDown={onFocus}
				data-window-handle={handle}
			>
				{resizable && !maximized && (
					<div class={styles.frame}>
						{allResizeHandlePositions.map((v, i) => (
							<ResizeHandle
								position={v}
								key={i}
								target={(xDst, yDst, horizontal, vertical) => {
									const realWidth = ref.current?.offsetWidth ?? 0;
									const realHeight = ref.current?.offsetHeight ?? 0;

									setWidth((oldWidth) => Math.min(oldWidth ?? realWidth, realWidth) + xDst);
									setHeight((oldHeight) => Math.min(oldHeight ?? realHeight, realHeight) + yDst);

									if (horizontal === 0) setX((oldX) => (oldX ?? 0) - xDst / innerWidth);
									if (vertical === 0) setY((oldY) => (oldY ?? 0) - yDst / innerHeight);
								}}
								onStartStop={(value) => setResizing(value ? v : undefined)}
							/>
						))}
					</div>
				)}
				<div class={styles.titlebar}>
					{icon && <Icon class={styles.icon} {...icon} />}
					<span
						class={styles.title}
						onPointerDown={(ev) => {
							if (draggable && ev.button === 0) {
								prevPos.current = [ev.clientX, ev.clientY];
								setDragState(1);
							}
						}}
					>
						{title}
					</span>
					<div class={styles.buttons}>
						{onMinimize && (
							<button title="Minimize" class={styles["button-minimize"]} onClick={onMinimize}>
								<Icon {...TitlebarButtons} />
							</button>
						)}
						{resizable && (
							<button
								title={maximized ? "Restore Down" : "Maximize"}
								class={maximized ? styles["button-restore"] : styles["button-maximize"]}
								onClick={() => setMaximized(!maximized)}
							>
								<Icon {...TitlebarButtons} />
							</button>
						)}
					</div>
					{onClose && (
						<button title="Close" class={styles["button-close"]} onClick={onClose}>
							<Icon {...TitlebarButtons} />
						</button>
					)}
				</div>
				<div class={styles.content}>{content}</div>
			</div>
		</WindowContext.Provider>
	);
}
