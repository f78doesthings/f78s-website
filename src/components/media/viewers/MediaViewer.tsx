/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { signal, useSignalEffect } from "@preact/signals";
import { type ComponentChildren, type JSX, render } from "preact";
import { useEffect, useRef } from "preact/hooks";
import FluentArrowDownload24Regular from "~icons/fluent/arrow-download-24-regular";
import FluentDismiss24Regular from "~icons/fluent/dismiss-24-regular";

import { getFileName } from "../../../scripts/utils";
import type { CopyrightInfo } from "../../../types";
import { OverlayContainer } from "../../utils/OverlayContainer";
import { MediaInfoOverlay } from "../utils/MediaInfoOverlay";

import styles from "./MediaViewer.module.scss";

export interface MediaProps extends CopyrightInfo {
	/** The media source. */
	src: string;

	/** Used for the caption. */
	children?: ComponentChildren;
}

// TODO: Consider refactoring this (especially since it's only used for the image viewer)
const registeredMediaViewers: Record<string, () => () => JSX.Element> = {};
const activeMediaViewer = signal<string>();

export function showMediaViewer(src: string) {
	activeMediaViewer.value = undefined;

	const Viewer = registeredMediaViewers[src]?.();
	if (!Viewer) {
		return console.warn("Could not find media viewer for source:", src);
	}

	const container = document.querySelector("#media-viewer-root");
	if (!container) {
		return console.warn("Could not find container element for media viewer");
	}

	activeMediaViewer.value = src;
	render(<Viewer />, container);
}

export function registerMedia<P extends MediaProps>(props: P, Viewer: (props: P) => JSX.Element) {
	registeredMediaViewers[props.src] = () => () => <Viewer {...props} />;
	return undefined;
}

export interface MediaViewerProps {
	/** Information about the media. */
	props: MediaProps;

	/** The extra buttons to add at the top. */
	buttons?: ComponentChildren;

	/** The media itself. */
	children?: ComponentChildren;

	/** The controls at the bottom. */
	controls?: ComponentChildren;
}

export function MediaViewer({ props, buttons, children, controls }: MediaViewerProps) {
	const ref = useRef<HTMLDivElement>(null);
	const baseName = getFileName(props.src);

	const close = () => {
		if (activeMediaViewer.value === props.src) {
			activeMediaViewer.value = undefined;
		}

		const target = ref.current;
		if (target) {
			target.classList.remove(styles.open, "open");
			setTimeout(() => target.remove(), 500);
		}
	};

	useEffect(() => {
		const target = ref.current;
		if (target) {
			target.classList.add(styles.open, "open");
		}
	});

	useSignalEffect(() => {
		if (activeMediaViewer.value !== props.src) {
			close();
		}
	});

	return (
		<OverlayContainer
			containerClass={styles["media-viewer"]}
			containerRef={ref}
			top={
				<>
					<MediaInfoOverlay {...props} />
					<div class="btn-media-group">
						{buttons}
						<a href={props.src} download={baseName} title="Download" aria-label="Download">
							<FluentArrowDownload24Regular />
						</a>
						<button
							class="btn-media-close"
							title="Close"
							aria-label="Close"
							onClick={() => (activeMediaViewer.value = undefined)}
						>
							<FluentDismiss24Regular />
						</button>
					</div>
				</>
			}
			bottom={controls}
		>
			{children}
		</OverlayContainer>
	);
}
