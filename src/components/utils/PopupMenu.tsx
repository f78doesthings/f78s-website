/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { toChildArray, type ButtonHTMLAttributes, type ComponentChildren } from "preact";
import { useRef, useState } from "preact/hooks";
import MoreIcon from "~icons/fluent/more-vertical-24-regular";

import styles from "./PopupMenu.module.scss";

interface Props extends ButtonHTMLAttributes {
	/** The button content. */
	content?: ComponentChildren;

	/** The menu items. */
	children?: ComponentChildren;
}

export function PopupMenu({ children, content = <MoreIcon />, ...props }: Props) {
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
			if (target instanceof Node && ref.current?.contains(target)) {
				return;
			}
		}

		setOpen(false);
		window.removeEventListener("click", closeMenu);
	};

	return (
		<div class={`popup-container ${styles["popup-container"]}`} ref={ref}>
			<button
				aria-label={props["aria-label"] ?? props.title}
				onClick={() => {
					if (isOpen) {
						closeMenu();
					} else {
						openMenu();
					}
				}}
				{...props}
			>
				{content}
			</button>
			<menu class={`popup-menu ${styles["popup-menu"]} ${isOpen ? styles["open"] : ""}`}>
				{menuItems}
			</menu>
		</div>
	);
}
