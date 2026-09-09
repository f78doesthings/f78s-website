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
import Link from "../../../components/nav/Link";
import { FilePicker } from "../../../components/utils/FilePicker";
import { useEventTarget } from "../../../scripts/utils/preact";

interface Props {
	demoSources: [name: string, src: string][];
}

const audioMimeTypeRegex = /^(audio|video)\//;

export function VisualizerApp({ demoSources }: Props) {
	const audio = useRef<HTMLAudioElement>(null);
	const filePicker = useRef<HTMLInputElement>(null);
	const src = useSignal<string>();
	const lastFileURL = useSignal<string>();

	useEventTarget(
		() => window,
		(on) => {
			on("drop", (ev) => {
				if (!ev.dataTransfer || ev.dataTransfer.files.length === 0) {
					return;
				}

				ev.preventDefault();
				document.body.classList.remove("dragging-file");

				if (filePicker.current) {
					filePicker.current.files = ev.dataTransfer.files;
					filePicker.current.dispatchEvent(new Event("change"));
				}
			});

			on("dragover", (ev) => {
				if (!ev.dataTransfer) {
					return;
				}

				// dataTransfer.files is not available here
				const fileItems = [...ev.dataTransfer.items].filter((item) => item.kind === "file");
				if (fileItems.length === 0) {
					return;
				}

				ev.preventDefault(); // Allow drop events
				if (fileItems.some((item) => audioMimeTypeRegex.test(item.type))) {
					ev.dataTransfer.dropEffect = "copy";
				} else {
					ev.dataTransfer.dropEffect = "none";
				}
			});

			on("dragenter", (ev) => {
				//console.debug("dragenter", ev);
				if (ev.dataTransfer && [...ev.dataTransfer.items].some((item) => item.kind === "file")) {
					document.body.classList.add("dragging-file");
					ev.preventDefault();
				}
			});

			on("dragleave", (ev) => {
				// These are set to 0 when the user actually stops dragging
				//console.debug("dragleave", ev);
				if (
					ev.clientX < 0 ||
					ev.clientY < 0 ||
					ev.clientX >= innerWidth ||
					ev.clientY >= innerHeight ||
					(ev.pageX === 0 && ev.pageY === 0)
				) {
					document.body.classList.remove("dragging-file");
				}
			});
		},
	);

	return (
		<>
			<FilePicker
				inputRef={filePicker}
				accept="audio/*, video/*"
				onChange={(ev) => {
					const file = ev.detail
						? [...ev.detail].find((item) => audioMimeTypeRegex.test(item.type))
						: undefined;
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
							if (lastFileURL.value) {
								URL.revokeObjectURL(lastFileURL.value);
							}
							lastFileURL.value = audio.current.src = URL.createObjectURL(file);
						}
					});
				}}
			/>
			<p>
				Don't have any audio files to play?{" "}
				<Link href="https://fie.nl.tab.digital/s/q7ntrLN2bz9grzX?dir=/Music" external>
					I've got you covered.
				</Link>
				<br />
				<small>
					The files you pick never leave your device. While you can select video files, the video
					itself is not displayed for now. You can also drag and drop files!
				</small>
			</p>
			<p style="margin-bottom: 0;">
				Or, alternatively, you can load one of these audio clips from the website:
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
			<p style="margin-top: 0;">
				<small>
					However, do note that these are 128kbps AAC files, and are therefore of fairly low
					quality.
				</small>
			</p>
			<AudioPlayerClient
				src={src.value}
				audioRef={audio}
				loop
				keepRunningVisualizers
				checkIfLoaded
			/>
		</>
	);
}
