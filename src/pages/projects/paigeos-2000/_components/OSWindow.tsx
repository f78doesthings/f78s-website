/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import clsx from "clsx";
import type { ComponentChildren } from "preact";
import { useLayoutEffect, useRef, useState } from "preact/hooks";
import CloseIcon from "~icons/mdi/window-close";
import MaximizeIcon from "~icons/mdi/window-maximize";
import MinimizeIcon from "~icons/mdi/window-minimize";
import RestoreIcon from "~icons/mdi/window-restore";

import { useEventTarget } from "../../../../scripts/utils/preact";

import styles from "./OSWindow.module.scss";

export interface WindowMetadata {
	icon?: ImageMetadata;
	title?: string;
	draggable?: boolean;
	resizable?: boolean;
	initialSize?: [width: number, height: number];
	initialPosition?: "center";
	children?: ComponentChildren;
}

export interface WindowState extends WindowMetadata {
	handle: number;
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
	draggable = true,
	resizable = true,
	initialSize,
	initialPosition,
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
	const [dragging, setDragging] = useState(false);
	const [prevPos, setPrevPos] = useState<[x: number, y: number]>([0, 0]);
	const [x, setX] = useState<number>();
	const [y, setY] = useState<number>();
	const ref = useRef<HTMLDivElement>(null);

	useEventTarget(
		() => window,
		(on) => {
			if (!draggable) {
				return;
			}

			on("pointermove", (ev) => {
				if (!dragging) {
					return;
				}

				if (maximized) {
					setMaximized(false);
					setX(ev.clientX / innerWidth);
					setY(ev.clientY / innerHeight);
				} else {
					setX((x ?? 0) + (ev.clientX - prevPos[0]) / innerWidth);
					setY((y ?? 0) + (ev.clientY - prevPos[1]) / innerHeight);
				}
				setPrevPos([ev.clientX, ev.clientY]);
			});

			on("pointerup", () => setDragging(false));
			on("pointercancel", () => setDragging(false));
		},
	);

	useLayoutEffect(() => {
		if (x === undefined && y === undefined && ref.current && initialPosition === "center") {
			const desktop = document.querySelector(".desktop");
			const bounds = desktop?.getBoundingClientRect();
			setX(0.5 - ref.current.offsetWidth / 2 / (bounds?.width ?? innerWidth));
			setY(0.5 - ref.current.offsetHeight / 2 / (bounds?.height ?? innerHeight));
		}
	}, []);

	return (
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
				{icon && <img alt="" class={styles.icon} {...icon} />}
				<span
					class={styles.title}
					onPointerDown={(ev) => {
						if (draggable) {
							setPrevPos([ev.clientX, ev.clientY]);
							setDragging(true);
						}
					}}
				>
					{title}
				</span>
				<div class={styles.buttons}>
					{onMinimize && (
						<button title="Minimize" onClick={onMinimize}>
							<MinimizeIcon />
						</button>
					)}
					{resizable && (
						<button
							title={maximized ? "Restore Down" : "Maximize"}
							onClick={() => setMaximized(!maximized)}
						>
							{maximized ? <RestoreIcon /> : <MaximizeIcon />}
						</button>
					)}
				</div>
				{onClose && (
					<button title="Close" onClick={onClose}>
						<CloseIcon />
					</button>
				)}
			</div>
			<div class={styles.content}>{content}</div>
		</div>
	);
}
