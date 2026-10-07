/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import clsx from "clsx";
import { createContext, type ComponentChildren } from "preact";
import { useLayoutEffect, useRef, useState } from "preact/hooks";

import { useEventTarget } from "../../../../scripts/utils/preact";
import TitlebarButtons from "../assets/images/titlebar-buttons.webp";
import { Icon } from "./ui/Icon";

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
	initialPosition?: [xPercent: number, yPercent: number];
	children?: ComponentChildren;
}

export interface WindowState extends WindowMetadata {
	handle: WindowHandle;
	minimized: boolean;
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
	const [maximized, setMaximized] = useState(false);
	const [dragging, setDragging] = useState(0);
	const [prevPos, setPrevPos] = useState<[x: number, y: number]>([0, 0]);
	const [x, setX] = useState<number>();
	const [y, setY] = useState<number>();
	const ref = useRef<HTMLDivElement>(null);

	const ctx: WindowContext = {
		handle,
	};

	useEventTarget(
		() => window,
		(on) => {
			if (!draggable) {
				return;
			}

			on("pointermove", (ev) => {
				if (dragging === 0 || !ref.current) {
					return;
				}

				if (dragging === 1) {
					const xDst = ev.clientX - prevPos[0];
					const yDst = ev.clientY - prevPos[1];
					const dst = Math.sqrt(xDst * xDst + yDst * yDst);
					if (dst < (maximized ? 8 : 4)) {
						return;
					}

					setDragging(2);
				}

				if (maximized) {
					setMaximized(false);
					setX(ev.clientX); // Actual value is set in the second useLayoutEffect below
					setY((ev.clientY - prevPos[1]) / innerHeight);
				} else {
					setX((x ?? 0) + (ev.clientX - prevPos[0]) / innerWidth);
					setY((y ?? 0) + (ev.clientY - prevPos[1]) / innerHeight);
				}

				setPrevPos([ev.clientX, ev.clientY]);
			});

			on("pointerup", () => setDragging(0));
			on("pointercancel", () => setDragging(0));
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
		if (!maximized && dragging !== 0 && ref.current && x !== undefined) {
			setX((x - ref.current.clientWidth * (x / innerWidth)) / innerWidth);
		}
	}, [maximized]);

	return (
		<WindowContext.Provider value={ctx}>
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
					width: initialSize?.[0],
					height: initialSize?.[1],
					zIndex,
				}}
				onPointerDown={onFocus}
				data-window-handle={handle}
			>
				<div class={styles.titlebar}>
					{icon && <Icon class={styles.icon} {...icon} />}
					<span
						class={styles.title}
						onPointerDown={(ev) => {
							if (draggable) {
								setPrevPos([ev.clientX, ev.clientY]);
								setDragging(1);
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
