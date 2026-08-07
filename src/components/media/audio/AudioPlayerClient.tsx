/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// A (currently simple) audio player.

import { useSignal } from "@preact/signals";
import { useSignalRef } from "@preact/signals/utils";
import type { AudioHTMLAttributes, Ref } from "preact";
import { useEffect, useRef } from "preact/hooks";

import { createMediaContext, type MediaContext } from "../../../scripts/utils/audio.js";
import { wrapRefs } from "../../../scripts/utils/preact.js";
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

		/** If present, visualizers keep running even if the audio played is paused. */
		noPause?: boolean;

		/** The source URL of the audio file. */
		src?: string;
	}
>;

/** The client-side portion of AudioPlayer. Use AudioPlayer in pages instead. */
export function AudioPlayerClient({
	src,
	class: className = "",
	noPause,
	audioRef,
	...props
}: Props) {
	const audio = useRef<HTMLAudioElement>(null);
	const root = useSignalRef<HTMLDivElement | null>(null);
	const contentContainer = useSignalRef<HTMLDivElement | null>(null);
	const mediaConnection = useSignal<MediaContext>();
	const isFullscreen = useSignal(false);
	const isPaused = useSignal(true);
	const mediaAnimation = useSignal<MediaShortcutAnimation>({});

	const updateFullscreen = () => {
		isFullscreen.value = root.current !== null && document.fullscreenElement === root.current;
	};

	const updatePaused = () => {
		isPaused.value = !noPause && (!audio.current || audio.current.paused || audio.current.ended);
	};

	useEffect(() => {
		if (!audio.current || !root.current) {
			return undefined;
		}

		if (!mediaConnection.value) {
			const connection = createMediaContext(audio.current);
			if (connection) {
				mediaConnection.value = connection;
			}
		}

		root.current.addEventListener("fullscreenchange", updateFullscreen);
		audio.current.addEventListener("play", updatePaused);
		audio.current.addEventListener("pause", updatePaused);
		audio.current.addEventListener("ended", updatePaused);

		return () => {
			root.current?.removeEventListener("fullscreenchange", updateFullscreen);
			audio.current?.removeEventListener("play", updatePaused);
			audio.current?.removeEventListener("pause", updatePaused);
			audio.current?.removeEventListener("ended", updatePaused);

			if (isFullscreen.value) {
				void document.exitFullscreen();
			}
		};
	}, []);

	// BUG: the visualizer occasionally disappears when paused on mobile outside of fullscreen
	return (
		<div ref={root} class={`${styles["audio-player"]} ${className}`} tabindex={0}>
			{src && <MediaInfoOverlay class={styles.info} src={src} {...props} />}
			<div class={styles.content} ref={contentContainer}>
				<VisualizerSelector
					media={mediaConnection}
					paused={isPaused}
					noPause={noPause}
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
