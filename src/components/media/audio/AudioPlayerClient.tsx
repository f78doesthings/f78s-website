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
import type { AudioHTMLAttributes } from "preact";
import { useEffect, useRef } from "preact/hooks";

import { createMediaContext, type MediaContext } from "../../../scripts/utils/audio.js";
import type { CopyrightInfo, Replace } from "../../../types.js";
import { MediaControls } from "../utils/MediaControls.jsx";
import { MediaInfoOverlay } from "../utils/MediaInfoOverlay.jsx";
import { VisualizerSelector } from "./visualizers/VisualizerSelector.js";

import styles from "./AudioPlayerClient.module.scss";

type Props = Replace<
	AudioHTMLAttributes,
	CopyrightInfo & {
		class?: string;
		src: string;
	}
>;

/** The client-side portion of AudioPlayer. Use AudioPlayer in pages instead. */
export function AudioPlayerClient({ src, children, class: className = "", ...props }: Props) {
	const audio = useRef<HTMLAudioElement>(null);
	const root = useSignalRef<HTMLDivElement | null>(null);
	const mediaConnection = useSignal<MediaContext>();
	const isFullscreen = useSignal(false);
	const isPaused = useSignal(true);

	const updateFullscreen = () => {
		isFullscreen.value = root.current !== null && document.fullscreenElement === root.current;
	};

	const updatePaused = async () => {
		isPaused.value = !audio.current || audio.current.paused || audio.current.ended;
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

	return (
		<div ref={root} class={`${styles["audio-player"]} ${className}`} tabindex={0}>
			<MediaInfoOverlay class={styles["info"]} src={src} {...props}>
				{children}
			</MediaInfoOverlay>
			<VisualizerSelector media={mediaConnection} paused={isPaused} class={styles["visualizer"]} />
			<MediaControls
				class={styles["controls"]}
				media={mediaConnection}
				download={props.license !== null ? src : undefined}
				mediaRoot={root}
			/>

			<audio src={src} ref={audio} preload="metadata" {...props} />
		</div>
	);
}
