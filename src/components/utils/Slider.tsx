/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useEffect, useRef, useState } from "preact/hooks";

import { clamp } from "../../scripts/utils";

import styles from "./Slider.module.scss";

export interface SliderDragState {
	newValue: number;
	percent: number;
}

interface Props {
	class?: string;

	/**
	 * The value of the slider.
	 *
	 * @default 0.5
	 */
	value?: number;

	/** If present, shows a second bar behind the main one. */
	secondaryValue?: number;

	/**
	 * The lowest allowed value.
	 *
	 * @default 0
	 */
	min?: number;

	/**
	 * The highest allowed value.
	 *
	 * @default 1
	 */
	max?: number;

	/**
	 * The step size.
	 *
	 * @default 0 // (no step size)
	 */
	step?: number;

	/** Prevents the slider from being dragged. */
	disabled?: boolean;

	/** Always shows the slider's thumb. */
	alwaysShowThumb?: boolean;

	/** Called when the user starts dragging the slider. */
	onDragStart?: () => void;

	/** Called when the user stops dragging the slider. */
	onDragEnd?: () => void;

	/** Called when the slider is dragged. */
	onDrag?: (state: SliderDragState) => void;
}

/** An experimental custom slider component. */
export function Slider({
	class: className = "",
	value = 0.5,
	secondaryValue,
	min = 0,
	max = 1,
	step = 0,
	disabled = false,
	alwaysShowThumb = false,
	onDragStart,
	onDragEnd,
	onDrag,
	...cid
}: Props) {
	if (!isFinite(min) || !isFinite(max) || !isFinite(value)) {
		disabled = true;
		value = 0;
		min = -Number.MAX_VALUE;
		max = Number.MAX_VALUE;
	}

	const [beingDragged, setDragging] = useState(false);
	const sliderContainer = useRef<HTMLDivElement>(null);
	const sliderThumb = useRef<HTMLDivElement>(null);
	const primaryFill = useRef<HTMLDivElement>(null);
	const secondaryFill = useRef<HTMLDivElement>(null);

	const updatePrimaryFill = (newValue = value) => {
		if (primaryFill.current && !beingDragged) {
			const percent = (newValue - min) / (max - min);
			primaryFill.current.style.setProperty("--fill-percent", `${percent}`);
		}
	};

	const startDragging = (ev: PointerEvent) => {
		if (disabled || ev.button !== 0) {
			return;
		}

		window.addEventListener("pointermove", dragged);
		window.addEventListener("pointerup", stopDragging);
		window.addEventListener("pointercancel", stopDragging);
		setDragging(true);
		onDragStart?.();
		dragged(ev);
	};

	const stopDragging = (ev: PointerEvent) => {
		if (ev.type === "pointercancel") {
			console.warn("Slider dragging was cancelled");
		}

		window.removeEventListener("pointermove", dragged);
		window.removeEventListener("pointerup", stopDragging);
		window.removeEventListener("pointercancel", stopDragging);
		setDragging(false);
		onDragEnd?.();
	};

	const dragged = (ev: PointerEvent) => {
		if (!sliderContainer.current || !sliderThumb.current) {
			return;
		}

		const bounds = sliderContainer.current.getBoundingClientRect();
		const thumbWidth = sliderThumb.current.clientWidth;
		const percent = clamp(
			(ev.clientX - bounds.left - thumbWidth / 2) / (bounds.width - thumbWidth),
			0,
			1,
		);
		const newValue = clamp(min + (max - min) * percent, min, max, step);
		updatePrimaryFill(newValue);
		onDrag?.({ newValue: newValue, percent });
	};

	useEffect(() => {
		updatePrimaryFill(value);
		if (secondaryValue !== undefined && isFinite(secondaryValue) && secondaryFill.current) {
			const percent = (secondaryValue - min) / (max - min);
			secondaryFill.current.style.setProperty("--fill-percent", `${percent}`);
		}
	}, [value, secondaryValue, min, max]);

	return (
		<div
			class={`slider ${styles.slider}${beingDragged ? " dragging" : ""} ${alwaysShowThumb || beingDragged ? styles["show-thumb"] : ""} ${className}`}
			ref={sliderContainer}
			onPointerDown={startDragging}
			{...cid}
		>
			<div class={styles.track}>
				<div class={styles["primary-fill"]} ref={primaryFill}>
					<div class={styles.thumb} ref={sliderThumb}></div>
				</div>
				<div class={styles["secondary-fill"]} ref={secondaryFill}></div>
			</div>
		</div>
	);
}
