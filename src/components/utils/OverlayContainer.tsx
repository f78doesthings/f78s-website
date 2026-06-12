/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ComponentChildren, Ref } from "preact";
import { useRef } from "preact/hooks";

import { wrapRefs } from "../../scripts/utils/preact";

import styles from "./OverlayContainer.module.scss";

interface Props {
	/** A reference to the root container. */
	containerRef?: Ref<HTMLDivElement>; // Cannot be named "ref" due to conflicts

	/** The extra classes to apply to the root container. */
	containerClass?: string;

	/** The extra classes to apply to the content container. */
	contentClass?: string;

	/** Whether the root container can be focused by the keyboard. */
	focusable?: boolean;

	/** Forces overlays to always be visible. */
	forceOverlays?: boolean;

	/** Show the top overlay persistently above the content instead of overlaying it. */
	lockTop?: boolean;

	/** Show the bottom overlay persistently below the content instead of overlaying. */
	lockBottom?: boolean;

	/** The content of the top overlay. */
	top?: ComponentChildren;

	/** The content of the center overlay. */
	center?: ComponentChildren;

	/** The content of the bottom overlay. */
	bottom?: ComponentChildren;

	/** The content to display overlays on top of. */
	children?: ComponentChildren;
}

// forwardRef will be made redundant in Preact 11, but for now it's needed
/** Helper component for displaying overlays over an element when the user hovers over it. */
export function OverlayContainer({
	containerRef,
	containerClass = "",
	contentClass = "",
	focusable,
	forceOverlays,
	lockTop,
	lockBottom,
	top,
	center,
	bottom,
	children,
}: Props) {
	const intervalId = useRef<number>(null);

	const setHovering = (target: HTMLElement) => {
		if (intervalId.current !== null) {
			window.clearTimeout(intervalId.current);
		}

		if (forceOverlays) {
			return;
		}

		target.classList.add(styles.hovering);
		intervalId.current = window.setTimeout(() => {
			if (!forceOverlays) {
				target.classList.remove(styles.hovering);
			}
		}, 2750);
	};

	return (
		<div
			class={`${styles["overlay-container"]} ${containerClass} ${forceOverlays && styles.hovering}`}
			ref={wrapRefs(containerRef, (container) => {
				if (container) {
					setHovering(container);
				}
			})}
			tabindex={focusable ? 0 : undefined}
			onPointerMove={(ev) => setHovering(ev.currentTarget)}
		>
			{top && <div class={`${styles.top} ${lockTop ? "" : styles.overlay}`}>{top}</div>}
			<div class={`${styles.content} ${contentClass}`}>{children}</div>
			{center && <div class={styles.center}>{center}</div>}
			{bottom && <div class={`${styles.bottom} ${lockBottom ? "" : styles.overlay}`}>{bottom}</div>}
		</div>
	);
}
