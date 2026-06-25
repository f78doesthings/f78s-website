/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ComponentChildren } from "preact";
import { useEffect, useRef } from "preact/hooks";

import styles from "./MediaShortcutResponse.module.scss";

type AnimationDirection = "up" | "down" | "left" | "right" | "grow" | "shrink";

interface Props {
	animation: MediaShortcutAnimation;
}

export interface MediaShortcutAnimation {
	icon?: ComponentChildren;
	overlay?: ComponentChildren;
	direction?: AnimationDirection;
}

const anchors: Record<AnimationDirection, string> = {
	up: "top",
	down: "bottom",
	left: "left",
	right: "right",
	grow: "center",
	shrink: "center",
};

/** Plays an animation for a media keyboard shortcut when the animation object changes. */
export function MediaShortcutResponse({ animation }: Props) {
	const animContainer = useRef<HTMLDivElement>(null);
	const overlayContainer = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!animation.icon || !animContainer.current) {
			return;
		}

		animContainer.current.style.transformOrigin = animation.direction
			? anchors[animation.direction]
			: "center";

		const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		animContainer.current.animate(
			{
				transform: reduceMotion
					? ["scale(100%)"]
					: animation.direction === "grow"
						? ["scale(87.5%)", "scale(90%)", "scale(100%)"]
						: ["scale(100%)", "scale(97.5%)", "scale(87.5%)"],
				opacity: [1, reduceMotion ? 1 : 0.8, 0],
				offset: [0, 0.56, 1],
			},
			{
				//easing: "cubic-bezier(0.65, 0, 0.65, 0.9)",
				easing: "ease",
				duration: reduceMotion ? 525 : 440,
				fill: "forwards",
			},
		);

		if (!animation.overlay || !overlayContainer.current) {
			return;
		}

		overlayContainer.current?.animate(
			{
				opacity: [1, 1, 0],
				offset: [0, 0.7, 1],
			},
			{
				easing: "ease",
				duration: 625,
				fill: "forwards",
			},
		);
	}, [animation]);

	return (
		<div class={styles["media-key-response"]}>
			{animation.overlay && (
				<div ref={overlayContainer} class={`${styles.overlay} media-style`}>
					{animation.overlay}
				</div>
			)}
			<div ref={animContainer} class={`${styles.animation} media-style`}>
				{animation.icon}
			</div>
		</div>
	);
}
