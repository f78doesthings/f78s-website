/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useSignal } from "@preact/signals";
import { useSignalRef } from "@preact/signals/utils";
import type { AudioHTMLAttributes, Ref } from "preact";
import { useEffect, useRef } from "preact/hooks";
import ErrorIcon from "~icons/fluent/error-circle-48-regular";

import { createMediaContext, type MediaContext } from "../../../scripts/utils/audio.js";
import { useEventTarget, wrapRefs } from "../../../scripts/utils/preact.js";
import type { CopyrightInfo, Replace } from "../../../types.js";
import { MediaControls } from "../utils/MediaControls.jsx";
import { MediaInfoOverlay } from "../utils/MediaInfoOverlay.jsx";
import {
	MediaShortcutResponse,
	type MediaShortcutAnimation,
} from "../utils/MediaShortcutResponse.js";

import "../../../styles/media.scss";
import { VisualizerSelector } from "./visualizers/VisualizerSelector.js";

import styles from "./AudioPlayerClient.module.scss";

type Props = Replace<
	Omit<AudioHTMLAttributes, "children">,
	CopyrightInfo & {
		/** Allows you to obtain a reference to the audio element. */
		audioRef?: Ref<HTMLAudioElement>;

		class?: string;

		/** If present, visualizers keep running even if the audio is paused. */
		keepRunningVisualizers?: boolean;

		/** The source URL of the audio file. */
		src?: string;

		/** Whether to show an error to the user if no media has been loaded. */
		checkIfLoaded?: boolean;
	}
>;

/** The client-side portion of AudioPlayer. Use AudioPlayer in pages instead. */
export function AudioPlayerClient({
	src,
	class: className = "",
	keepRunningVisualizers,
	checkIfLoaded = false,
	audioRef,
	...props
}: Props) {
	const audio = useRef<HTMLAudioElement>(null);
	const root = useSignalRef<HTMLDivElement | null>(null);
	const contentContainer = useSignalRef<HTMLDivElement | null>(null);
	const mediaConnection = useSignal<MediaContext>();
	const isFullscreen = useSignal(false);
	const isPaused = useSignal(true);
	const hasErrored = useSignal<boolean>();
	const mediaAnimation = useSignal<MediaShortcutAnimation>({});

	useEffect(() => {
		if (audio.current && !mediaConnection.value) {
			const connection = createMediaContext(audio.current);
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
		() => root.current,
		(on) => {
			on("fullscreenchange", () => {
				isFullscreen.value = root.current !== null && document.fullscreenElement === root.current;
			});
		},
	);

	useEventTarget(
		() => audio.current,
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

	// BUG: the visualizer occasionally disappears when paused on mobile outside of fullscreen
	return (
		<div ref={root} class={`${styles["audio-player"]} ${className}`} tabindex={0}>
			{src && <MediaInfoOverlay class={styles.info} src={src} {...props} />}
			<div class={styles.content} ref={contentContainer}>
				{(hasErrored.value ?? (checkIfLoaded && !audio.current?.src)) && (
					<div class="media-error-overlay">
						<ErrorIcon />
						<p>
							{hasErrored.value
								? "Failed to load audio. Your browser may not support this audio format."
								: "No audio has been loaded."}
						</p>
					</div>
				)}
				<VisualizerSelector
					media={mediaConnection}
					paused={isPaused}
					noPause={keepRunningVisualizers}
					class={styles.visualizer}
				/>
				<MediaShortcutResponse animation={mediaAnimation.value} />
			</div>
			<MediaControls
				class={styles.controls}
				media={mediaConnection}
				download={props.license !== null ? src : undefined}
				mediaRoot={root}
				clickTarget={contentContainer}
				mediaAnimation={mediaAnimation}
			/>

			<audio src={src} ref={wrapRefs(audio, audioRef)} preload="metadata" {...props} />
		</div>
	);
}
