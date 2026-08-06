/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useSignal } from "@preact/signals";
import { useRef } from "preact/hooks";

import { AudioPlayerClient } from "../../../components/media/audio/AudioPlayerClient";
import { FilePicker } from "../../../components/utils/FilePicker";

interface Props {
	demoSources: [name: string, src: string][];
}

export function VisualizerApp({ demoSources }: Props) {
	const audio = useRef<HTMLAudioElement>(null);
	const filePicker = useRef<HTMLInputElement>(null);
	const src = useSignal<string>();
	return (
		<>
			<FilePicker
				inputRef={filePicker}
				accept="audio/*, video/*"
				onChange={(ev) => {
					const file = ev.detail?.[0];
					if (!file || !audio.current) {
						if (!src.value) {
							ev.preventDefault();
						}
						return;
					}

					src.value = undefined;
					setTimeout(() => {
						if (!audio.current) {
							return;
						}

						try {
							audio.current.srcObject = file;
						} catch (e) {
							console.warn(
								"Failed to assign File to srcObject, falling back to src + createObjectURL.\n",
								e,
							);
							audio.current.src = URL.createObjectURL(file);
						}
					});
				}}
			/>
			<p style="margin-bottom: 0;">
				Or load one of the audio clips from the website{" "}
				<small>(though keep in mind that these are fairly low quality 128kbps AAC files)</small>:
			</p>
			<div class="demos">
				{demoSources.map(([name, newSrc]) => (
					<button
						class={`btn-secondary${src.value === newSrc ? " selected-demo" : ""}`}
						onClick={() => {
							src.value = newSrc;
							if (filePicker.current) {
								filePicker.current.value = "";
								filePicker.current.dispatchEvent(new Event("change"));
							}
						}}
					>
						{name}
					</button>
				))}
			</div>
			<AudioPlayerClient src={src.value} audioRef={audio} noPause />
		</>
	);
}
