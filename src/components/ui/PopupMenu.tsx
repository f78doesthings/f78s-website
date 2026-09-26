/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import clsx from "clsx";
import { toChildArray, type ButtonHTMLAttributes, type ComponentChildren } from "preact";
import { useRef, useState } from "preact/hooks";
import MoreIcon from "~icons/fluent/more-vertical-24-regular";

import styles from "./PopupMenu.module.scss";

interface Props extends ButtonHTMLAttributes {
	class?: string;

	/** The button content. */
	content?: ComponentChildren;

	/** The menu items. */
	children?: ComponentChildren;

	/** How the menu should be aligned relative to the button. */
	align?: "left" | "right";

	/** If `true`, the built-in theme is disabled, keeping only the essential styles. */
	noTheme?: boolean;

	/** The timing to use for opening the pop-up menu. */
	trigger?: "pointerdown" | "click";
}

export function PopupMenu({
	class: className,
	children,
	content = <MoreIcon />,
	align = "right",
	noTheme,
	trigger = "click",
	...props
}: Props) {
	const [isOpen, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const menuItems = toChildArray(children).map((child) => <li>{child}</li>);

	const openMenu = () => {
		setOpen(true);
		window.addEventListener("click", closeMenu);
	};

	const closeMenu = (ev?: MouseEvent) => {
		if (ev) {
			const target = ev.target;
			if (
				target instanceof Element &&
				ref.current?.contains(target) &&
				!target.closest("[data-dismisses-popup]")
			) {
				return;
			}
		}

		setOpen(false);
		window.removeEventListener("click", closeMenu);
	};

	return (
		<div class={clsx("popup-container", styles["popup-container"])} ref={ref}>
			<button
				aria-label={props["aria-label"] ?? props.title}
				class={clsx(className, isOpen && ["open", styles.open])}
				{...{
					[trigger === "pointerdown" ? "onPointerDown" : "onClick"]: () => {
						if (isOpen) {
							closeMenu();
						} else {
							openMenu();
						}
					},
				}}
				{...props}
			>
				{content}
			</button>
			<menu
				class={clsx(
					"popup-menu",
					styles["popup-menu"],
					styles[`align-${align}`],
					isOpen && ["open", styles.open],
					!noTheme && "media-style-blur",
					!noTheme && styles.themed,
				)}
			>
				{menuItems}
			</menu>
		</div>
	);
}
