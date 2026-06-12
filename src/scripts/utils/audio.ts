/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { signal } from "@preact/signals";

const audioContext = signal<AudioContext>();
const connectedMedia = signal(new Map<HTMLMediaElement, MediaContext>());
const playingMedia = signal(new Set<HTMLMediaElement>());

export interface MediaContext {
	context: AudioContext;
	source: MediaElementAudioSourceNode;
	amplifier: GainNode;
}

/** Connects a media element to the global audio context. */
export function createMediaContext(media: HTMLMediaElement): MediaContext | undefined {
	try {
		const existing = connectedMedia.value.get(media);
		if (existing) {
			return existing;
		}

		if (!audioContext.value) {
			audioContext.value = new AudioContext();
			console.debug("Created audio context:", audioContext.value);
		}

		// oxlint-disable-next-line typescript/no-unsafe-type-assertion
		const source = audioContext.value.createMediaElementSource(media);
		const amplifier = audioContext.value.createGain();
		amplifier.gain.value = 0.5;
		source.connect(amplifier);
		amplifier.connect(audioContext.value.destination);

		const setPlaying = async (playing: boolean) => {
			if (playing) {
				playingMedia.value.add(media);
			} else {
				playingMedia.value.delete(media);
			}

			if (playingMedia.value.size > 0) {
				await audioContext.value?.resume();
			} else {
				await audioContext.value?.suspend();
			}
		};

		media.addEventListener("play", () => setPlaying(true));
		media.addEventListener("pause", () => setPlaying(false));
		media.addEventListener("ended", () => setPlaying(false));

		return {
			context: audioContext.value,
			source,
			amplifier,
		};
	} catch (e) {
		// Happens when media components are reloaded for some reason
		// (doesn't seem to cause any issues though)
		console.warn("Failed to connect media to global audio context:", e);
		return undefined;
	}
}
