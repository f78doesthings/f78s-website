/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useComputed, useSignal } from "@preact/signals";
import { useSignalRef } from "@preact/signals/utils";
import type { VideoHTMLAttributes } from "preact";
import { useEffect, useRef } from "preact/hooks";

import { createMediaContext, type MediaContext } from "../../../scripts/utils/audio";
import type { Replace, CopyrightInfo } from "../../../types";
import { OverlayContainer } from "../../utils/OverlayContainer";
import { VisualizerSelector } from "../audio/visualizers/VisualizerSelector";
import { MediaControls } from "../utils/MediaControls";
import { MediaInfoOverlay } from "../utils/MediaInfoOverlay";

import styles from "./VideoPlayerClient.module.scss";

type Props = Replace<
	VideoHTMLAttributes,
	CopyrightInfo & {
		class?: string;
		src: string;
	}
>;

/** The client-side portion of VideoPlayer. Use VideoPlayer in pages instead. */
export function VideoPlayerClient({ src, children, class: className = "", ...props }: Props) {
	// There is a fair bit of code duplicated from AudioPlayerClient,
	// should probably be refactored at some point
	const video = useRef<HTMLVideoElement>(null);
	const root = useSignalRef<HTMLDivElement | null>(null);
	const mediaConnection = useSignal<MediaContext>();
	const isFullscreen = useSignal(false);
	const isPaused = useSignal(true);
	const pauseVisualizer = useComputed(() => isPaused.value || !isFullscreen.value);

	//#region Event listeners

	const updateFullscreen = () => {
		isFullscreen.value = root.current !== null && document.fullscreenElement === root.current;
	};

	const updatePaused = async () => {
		isPaused.value = !video.current || video.current.paused || video.current.ended;
	};

	useEffect(() => {
		if (!video.current || !root.current) {
			return undefined;
		}

		if (!mediaConnection.value) {
			const connection = createMediaContext(video.current);
			if (connection) {
				mediaConnection.value = connection;
			}
		}

		root.current.addEventListener("fullscreenchange", updateFullscreen);
		video.current.addEventListener("play", updatePaused);
		video.current.addEventListener("pause", updatePaused);
		video.current.addEventListener("ended", updatePaused);

		return () => {
			root.current?.removeEventListener("fullscreenchange", updateFullscreen);
			video.current?.removeEventListener("play", updatePaused);
			video.current?.removeEventListener("pause", updatePaused);
			video.current?.removeEventListener("ended", updatePaused);

			if (isFullscreen.value) {
				void document.exitFullscreen();
			}
		};
	}, []);

	//#endregion

	return (
		<OverlayContainer
			containerRef={root}
			containerClass={`${styles["video-player-container"]} ${className}`}
			contentClass={styles["video-player-content"]}
			focusable
			forceOverlays={isPaused.value}
			lockBottom={!isFullscreen.value}
			top={
				isFullscreen.value && (
					<MediaInfoOverlay src={src} {...props}>
						{children}
					</MediaInfoOverlay>
				)
			}
			bottom={
				<MediaControls
					media={mediaConnection}
					download={props.license !== null ? src : undefined}
					mediaRoot={root}
				></MediaControls>
			}
		>
			<video src={src} ref={video} preload="metadata" class={styles.video} {...props} />
			<VisualizerSelector
				media={mediaConnection}
				paused={pauseVisualizer}
				class={styles.visualizer}
			/>
		</OverlayContainer>
	);
}
