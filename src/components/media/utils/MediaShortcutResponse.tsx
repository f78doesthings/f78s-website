/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ComponentChildren } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";

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

const anchors: Record<AnimationDirection, [from: string, to: string]> = {
	up: ["bottom", "top"],
	down: ["top", "bottom"],
	left: ["right", "left"],
	right: ["left", "right"],
	grow: ["center", "center"],
	shrink: ["center", "center"],
};

/** Plays an animation for a media keyboard shortcut when the animation object changes. */
export function MediaShortcutResponse({ animation }: Props) {
	const [currentId, setCurrentId] = useState<number>();
	const [nextId, setNextId] = useState(1);
	const animContainer = useRef<HTMLDivElement>(null);
	const overlayContainer = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!animation.icon || !animContainer.current) {
			return;
		}

		const [fromAnchor, toAnchor] = animation.direction
			? anchors[animation.direction]
			: ["center", "center"];
		const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const animObject = animContainer.current.animate(
			{
				transform: reduceMotion
					? ["scale(100%)"]
					: [
							animation.direction === "shrink" ? "scale(112%)" : "scale(87%)",
							"scale(100%)",
							"scale(100%)",
							animation.direction === "grow" ? "scale(112%)" : "scale(87%)",
						],

				transformOrigin: [fromAnchor, fromAnchor, toAnchor, toAnchor],
				opacity: [currentId ? 1 : 0, 1, 1, 0],
				offset: [0, 0.22, 0.78, 1],
			},
			{
				duration: 700,
				easing: "linear",
				fill: "forwards",
			},
		);

		const newId = nextId;
		setCurrentId(newId);
		setNextId((id) => id + 1);

		const cleanup = () => {
			setCurrentId((id) => (id === newId ? undefined : id));
			animObject.removeEventListener("cancel", cleanup);
			animObject.removeEventListener("finish", cleanup);
		};

		animObject.addEventListener("cancel", cleanup);
		animObject.addEventListener("finish", cleanup);

		if (!animation.overlay || !overlayContainer.current) {
			return;
		}

		overlayContainer.current?.animate(
			{
				opacity: [currentId ? 1 : 0, 1, 1, 0],
				offset: [0, 0.22, 0.78, 1],
			},
			{
				duration: 700,
				easing: "linear",
				fill: "forwards",
			},
		);
	}, [animation]);

	return (
		<div class={styles["media-key-response"]}>
			{animation.overlay && (
				<div ref={overlayContainer} class={`${styles.overlay} media-style-blur`}>
					{animation.overlay}
				</div>
			)}
			<div ref={animContainer} class={`${styles.animation} media-style-blur`}>
				{animation.icon}
			</div>
		</div>
	);
}
