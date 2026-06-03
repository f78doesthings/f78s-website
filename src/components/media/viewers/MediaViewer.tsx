/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { type ComponentChildren, type JSX, render } from "preact";
import { useEffect, useRef } from "preact/hooks";
import FluentArrowDownload24Regular from "~icons/fluent/arrow-download-24-regular";
import FluentDismiss24Regular from "~icons/fluent/dismiss-24-regular";

import { getFileName } from "../../../scripts/utils";
import type { CopyrightInfo } from "../../../types";
import Badge from "../../Badge";
import LicenseNotice from "../utils/LicenseNotice";

import styles from "./MediaViewer.module.scss";

declare global {
	interface Window {
		activeMediaViewer?: string;
	}
}

export interface MediaProps extends CopyrightInfo {
	/** The media source. */
	src: string;

	/** Used for the caption. */
	children?: ComponentChildren;
}

// HACK: I'd say this whole showing code is pretty scuffed...
const registeredMediaViewers: Record<string, () => () => JSX.Element> = {};

export function showMediaViewer(src: string) {
	if (window.activeMediaViewer) {
		console.warn("A media viewer is already open, won't open another one");
		return;
	}

	const Viewer = registeredMediaViewers[src]?.();
	if (!Viewer) {
		return console.warn("Could not find media viewer for source:", src);
	}

	const container = document.querySelector("#media-viewer-root");
	if (!container) {
		return console.warn("Could not find container element for media viewer");
	}

	window.activeMediaViewer = src;
	render(<Viewer />, container);
}

export function registerMedia<P extends MediaProps>(props: P, Viewer: (props: P) => JSX.Element) {
	registeredMediaViewers[props.src] = () => () => <Viewer {...props} />;
}

export interface MediaViewerProps {
	/** Information about the media. */
	props: MediaProps;

	/** The extra buttons to add at the top. */
	buttons?: ComponentChildren;

	/** The media itself. */
	children: ComponentChildren;

	/** The controls at the bottom. */
	controls?: ComponentChildren;
}

export function MediaViewer({ props, buttons, children, controls }: MediaViewerProps) {
	const ref = useRef<HTMLElement>(null);
	const intervalId = useRef<number>(null);

	const baseName = getFileName(props.src);
	const [fileName, extName] = baseName.split(".");

	const setHovering = (target: HTMLElement) => {
		if (intervalId.current !== null) {
			window.clearTimeout(intervalId.current);
		}

		target.classList.add(styles.hovering);
		intervalId.current = window.setTimeout(() => target.classList.remove(styles.hovering), 2750);
	};

	const close = () => {
		if (window.activeMediaViewer === props.src) {
			window.activeMediaViewer = undefined;
		}

		const target = ref.current;
		if (target) {
			target.classList.remove(styles.open, "open");
			setTimeout(() => target.remove(), 500);
		}
	};

	useEffect(() => {
		if (ref.current) {
			ref.current.classList.add(styles.open, "open");
			setHovering(ref.current);
		}
	});

	return (
		<article
			class={styles["media-viewer"]}
			ref={ref}
			onMouseMove={(ev) => setHovering(ev.currentTarget)}
		>
			<div class={styles.top}>
				<div class={styles.info}>
					<h2 class={styles.title}>
						<span>
							{fileName}
							<span class={styles["file-type"]}>.{extName}</span>
						</span>
						<Badge type="beta" class={styles.badge} />
					</h2>
					<div class={styles.caption}>{props.children}</div>
					<LicenseNotice {...props} />
				</div>
				<div class={styles.buttons}>
					{buttons}
					<a href={props.src} download={baseName} title="Download" aria-label="Download">
						<FluentArrowDownload24Regular />
					</a>
					<button class={styles["close-button"]} title="Close" aria-label="Close" onClick={close}>
						<FluentDismiss24Regular />
					</button>
				</div>
			</div>
			<div class={styles.content}>{children}</div>
			<div class={styles.bottom}>{controls}</div>
		</article>
	);
}
