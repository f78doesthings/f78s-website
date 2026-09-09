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
import ErrorIcon from "~icons/fluent/error-circle-48-regular";

import { createMediaContext, type MediaContext } from "../../../scripts/utils/audio";
import { useEventTarget } from "../../../scripts/utils/preact";
import type { Replace, CopyrightInfo } from "../../../types";
import { OverlayContainer } from "../../utils/OverlayContainer";
import { VisualizerSelector } from "../audio/visualizers/VisualizerSelector";
import { MediaControls } from "../utils/MediaControls";

import "../../../styles/media.scss";
import { MediaInfoOverlay } from "../utils/MediaInfoOverlay";
import { MediaShortcutResponse, type MediaShortcutAnimation } from "../utils/MediaShortcutResponse";

import styles from "./VideoPlayerClient.module.scss";

type Props = Replace<
	Omit<VideoHTMLAttributes, "children">,
	CopyrightInfo & {
		class?: string;

		/** The source URL of the video file. */
		src: string;

		/** Whether to show an error to the user if no media has been loaded. */
		checkIfLoaded?: boolean;

		/**
		 * Controls when to show the audio visualizer.
		 *
		 * @default "fullscreen"
		 */
		visualizer?: "never" | "fullscreen" | "always";
	}
>;

/** The client-side portion of VideoPlayer. Use VideoPlayer in pages instead. */
export function VideoPlayerClient({
	src,
	class: className = "",
	checkIfLoaded = false,
	visualizer = "fullscreen",
	...props
}: Props) {
	// TODO: There is a fair bit of code duplicated from AudioPlayerClient,
	//       should probably be refactored at some point
	const video = useRef<HTMLVideoElement>(null);
	const root = useSignalRef<HTMLDivElement | null>(null);
	const contentContainer = useSignalRef<HTMLDivElement | null>(null);

	const isPaused = useSignal(true);
	const isFullscreen = useSignal(false);
	const isOverlaying = useSignal(false);
	const hasErrored = useSignal<boolean>();
	const mediaConnection = useSignal<MediaContext>();
	const mediaAnimation = useSignal<MediaShortcutAnimation>({});

	const enableTaps = useComputed(() => isOverlaying.value || !isFullscreen.value);
	const pauseVisualizer = useComputed(() => !isFullscreen.value);

	//#region Event listeners

	useEffect(() => {
		if (video.current && !mediaConnection.value) {
			const connection = createMediaContext(video.current);
			if (connection) {
				mediaConnection.value = connection;
			}
		}

		return () => {
			if (isFullscreen.value) {
				void document.exitFullscreen();
				isFullscreen.value = false;
			}
		};
	}, []);

	useEventTarget(
		// This has to be a function, or else it causes an infinite loop. Don't ask me why.
		() => root.current,
		(on) => {
			on("fullscreenchange", () => {
				isFullscreen.value = root.current !== null && document.fullscreenElement === root.current;
			});
		},
	);

	useEventTarget(
		// And here it's needed to fix isPaused not getting set.
		// There's some serious hackery going on here...
		() => video.current,
		(on) => {
			on("play", () => (isPaused.value = false));
			on("pause", () => (isPaused.value = true));
			on("ended", () => (isPaused.value = true));
			on("loadstart", () => {
				hasErrored.value = false;
				isPaused.value = true;
			});
			on("error", () => (hasErrored.value = true));
		},
	);

	//#endregion

	return (
		<OverlayContainer
			containerRef={root}
			contentRef={contentContainer}
			containerClass={`${styles["video-player-container"]} ${className}`}
			contentClass={styles["video-player-content"]}
			focusable
			forceOverlays={isPaused.value}
			lockBottom={!isFullscreen.value}
			onOverlayChange={(overlaying) => (isOverlaying.value = overlaying)}
			top={isFullscreen.value && <MediaInfoOverlay src={src} {...props} />}
			bottom={
				<MediaControls
					media={mediaConnection}
					download={props.license !== null ? src : undefined}
					mediaRoot={root}
					enableTaps={enableTaps}
					clickTarget={contentContainer}
					mediaAnimation={mediaAnimation}
				/>
			}
		>
			{(hasErrored.value ?? (checkIfLoaded && !video.current?.src)) && (
				<div class="media-error-overlay">
					<ErrorIcon />
					<p>
						{hasErrored.value
							? "Failed to load video. Your browser may not support this video format."
							: "No video has been loaded."}
					</p>
				</div>
			)}
			<video src={src} ref={video} preload="metadata" class={styles.video} {...props} />
			{visualizer !== "never" && (
				<VisualizerSelector
					media={mediaConnection}
					paused={pauseVisualizer}
					class={`${styles.visualizer} ${visualizer === "fullscreen" ? styles["fullscreen-only"] : ""}`}
				/>
			)}
			<MediaShortcutResponse animation={mediaAnimation.value} />
		</OverlayContainer>
	);
}
