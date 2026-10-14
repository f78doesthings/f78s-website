/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useSignal } from "@preact/signals";
import { useSignalRef } from "@preact/signals/utils";
import { useEffect, useRef, useState } from "preact/hooks";
import SystemAudioIcon from "~icons/fluent/desktop-speaker-20-regular";
import AudioFileIcon from "~icons/fluent/document-20-regular";
import MicrophoneIcon from "~icons/fluent/mic-20-regular";
import DemoIcon from "~icons/fluent/music-note-2-20-regular";
import StartCaptureIcon from "~icons/fluent/record-20-regular";
import StopCaptureIcon from "~icons/fluent/record-stop-20-regular";

import { VisualizerSelector } from "../../../components/media/audio/visualizers/VisualizerSelector";
import { MediaControls } from "../../../components/media/utils/MediaControls";
import {
	MediaShortcutResponse,
	type MediaShortcutAnimation,
} from "../../../components/media/utils/MediaShortcutResponse";
import Link from "../../../components/nav/Link";
import { FilePicker } from "../../../components/ui/FilePicker";
import { type MediaContext } from "../../../scripts/utils/audio";
import { useEventTarget } from "../../../scripts/utils/preact";
import type { IconComponent } from "../../../types";

import styles from "./_VisualizerApp.module.scss";

interface Props {
	demoSources: [name: string, src: string][];
}

const audioMimeTypeRegex = /^(audio|video)\//;

interface InputSourceInfo {
	icon: IconComponent;
	title: string;
	description: string;
}

const INPUT_SOURCES = {
	file: {
		icon: AudioFileIcon,
		title: "Audio File",
		description: "Play any supported audio file stored on your device.",
	},
	demo: {
		icon: DemoIcon,
		title: "Demo (low quality)",
		description: "Quickly try out the visualizer with an audio file from the website.",
	},
	microphone: {
		icon: MicrophoneIcon,
		title: "Microphone Input (alpha)",
		description: "Visualize audio coming from your microphone.",
	},
	system: {
		icon: SystemAudioIcon,
		title: "System Audio (alpha, limited support)",
		description: "Visualize audio from a browser tab or your system.",
	},
} satisfies Record<string, InputSourceInfo>;

type InputSource = keyof typeof INPUT_SOURCES;

export function VisualizerApp({ demoSources }: Props) {
	const [inputSource, setInputSource] = useState<InputSource>("file");

	const audio = useRef<HTMLAudioElement>(null);
	const filePicker = useRef<HTMLInputElement>(null);
	const audioSource = useRef<MediaElementAudioSourceNode>();
	const lastFileURL = useRef<string>();
	const doNotUnload = useRef(false);

	const root = useSignalRef<HTMLDivElement | null>(null);
	const contentContainer = useSignalRef<HTMLDivElement | null>(null);
	const mediaAnimation = useSignal<MediaShortcutAnimation>({});

	const media = useSignal<MediaContext>();
	const src = useSignal("");
	const activeStream = useSignal<MediaStreamAudioSourceNode>();

	const unloadAudio = (stream?: MediaStream) => {
		console.debug("endMediaStream", stream, activeStream.value);
		if (stream) {
			for (const track of stream.getTracks()) {
				track.stop();
			}
			return;
		}

		if (activeStream.value) {
			unloadAudio(activeStream.value.mediaStream);
			activeStream.value.disconnect();
			activeStream.value = undefined;
		}

		if (lastFileURL.current) {
			URL.revokeObjectURL(lastFileURL.current);
			lastFileURL.current = undefined;
		}
	};

	useEffect(() => {
		// Initialize if needed
		if (!media.value) {
			const context = new AudioContext();
			const amplifier = context.createGain();
			amplifier.connect(context.destination);
			media.value = {
				context,
				amplifier,
			};
		}

		if (audio.current && !audioSource.current) {
			try {
				const source = media.value.context.createMediaElementSource(audio.current);
				source.connect(media.value.amplifier);
				audioSource.current = source;
			} catch (e) {
				console.warn("Failed to create audio source node:\n", e);
			}
		}

		// Remove any loaded audio since we changed sources
		console.debug("doNotUnload", doNotUnload.current);
		if (!doNotUnload.current) {
			if (filePicker.current) {
				filePicker.current.value = "";
				filePicker.current.dispatchEvent(new Event("change"));
			}

			src.value = "";
			unloadAudio();
		}
		doNotUnload.current = false;

		const source =
			inputSource === "microphone" || inputSource === "system"
				? activeStream.value
				: audioSource.current;

		media.value = {
			...media.value,
			source,
		};
	}, [inputSource]);

	useEventTarget(
		() => window,
		(on) => {
			on("drop", (ev) => {
				console.debug("drop", ev);
				const files = ev.dataTransfer?.files;
				if (!files || files.length === 0) {
					return;
				}

				ev.preventDefault();
				document.body.classList.remove("dragging-file");

				if (filePicker.current) {
					doNotUnload.current = true;
					unloadAudio();
					setInputSource("file");

					filePicker.current.files = files;
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

				// BUG: this prevents the drop event from being fired, which is not what I want
				/*if (fileItems.some((item) => audioMimeTypeRegex.test(item.type))) {
					ev.dataTransfer.dropEffect = "copy";
				} else {
					ev.dataTransfer.dropEffect = "none";
				}*/
			});

			on("dragenter", (ev) => {
				//console.debug("dragenter", ev);
				if (ev.dataTransfer && [...ev.dataTransfer.items].some((item) => item.kind === "file")) {
					document.body.classList.add("dragging-file");
					ev.preventDefault();
				}
			});

			on("dragleave", (ev) => {
				// A ton of bogus events are fired here, so we need to check if either the mouse
				// moved off the screen, or the user actually stopped dragging

				const movedOffscreen =
					ev.clientX < 0 ||
					ev.clientY < 0 ||
					ev.clientX >= document.documentElement.clientWidth ||
					ev.clientY >= document.documentElement.clientHeight;
				const stoppedDragging = ev.pageX === 0 && ev.pageY === 0;
				console.debug("dragleave", ev);

				if (movedOffscreen || stoppedDragging) {
					document.body.classList.remove("dragging-file");
				}
			});
		},
	);

	return (
		<>
			<p>
				<strong>First, select the audio source you want to use:</strong>
			</p>
			{Object.entries(INPUT_SOURCES).map(([k, v]) => (
				<label class={styles["input-source"]}>
					<input
						type="radio"
						key={k}
						value={k}
						checked={inputSource === k}
						onChange={() => {
							// oxlint-disable-next-line typescript/no-unsafe-type-assertion
							setInputSource(k as InputSource);
						}}
					/>
					<v.icon />
					<span class={styles.title}>{v.title}</span>
					<span class={styles.description}>{v.description}</span>
				</label>
			))}

			<p>
				<strong>Then set up the selected audio source:</strong>
			</p>
			<FilePicker
				inputRef={filePicker}
				accept="audio/*, video/*"
				hidden={inputSource !== "file"}
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

					setTimeout(() => {
						if (!audio.current) {
							return;
						}

						try {
							// This only works with Safari as of October 2026.
							//
							// Other browsers only support using MediaStream here (and worse, doing that seems
							// to completely bypass the Web Audio API, rendering it useless!)
							audio.current.srcObject = file;
							src.value = "";
						} catch (e) {
							console.debug(
								"Failed to assign File to srcObject, falling back to src + createObjectURL.\n",
								e,
							);
							unloadAudio();
							lastFileURL.current = src.value = URL.createObjectURL(file);
						}
					});
				}}
			/>
			{inputSource === "file" && (
				<p>
					Don't have any audio files to play?{" "}
					<Link href="https://fie.nl.tab.digital/s/q7ntrLN2bz9grzX?dir=/Music" external>
						I've got you covered.
					</Link>
					<br />
					<small>
						You can also drag and drop files onto this page at any time! While you can load video
						files, the video itself is not displayed for now.
					</small>
				</p>
			)}
			{inputSource === "system" && (
				<p>
					<strong>Note:</strong> This feature currently has{" "}
					<Link
						external
						href="https://caniuse.com/mdn-api_mediadevices_getdisplaymedia_audio_capture_support"
					>
						very poor browser support
					</Link>
					.<br />
					<small>
						As of October 2026, it only works in Chromium, and Mac/Linux users can only capture
						audio from other tabs this way.
					</small>
				</p>
			)}
			{(inputSource === "microphone" || inputSource === "system") && (
				<button
					class="btn"
					onClick={async () => {
						if (activeStream.value) {
							return unloadAudio();
						}

						// Audio should be stereo and unprocessed
						const AUDIO_SETTINGS: MediaTrackConstraints = {
							channelCount: 2,
							autoGainControl: false,
							echoCancellation: false,
							noiseSuppression: false,
						};

						const stream =
							inputSource === "system"
								? await navigator.mediaDevices.getDisplayMedia({
										audio: AUDIO_SETTINGS,
									})
								: await navigator.mediaDevices.getUserMedia({
										audio: AUDIO_SETTINGS,
									});

						if (!media.value || !audio.current) {
							return unloadAudio(stream);
						}

						// Note that we do not hook up this stream to the amplifier/output,
						// as that might result in a nasty feedback loop.
						const source = media.value.context.createMediaStreamSource(stream);
						activeStream.value = source;
						media.value = {
							...media.value,
							source,
						};
					}}
				>
					{activeStream.value ? (
						<>
							<StopCaptureIcon /> Stop Capturing
						</>
					) : (
						<>
							<StartCaptureIcon /> Start Capturing
						</>
					)}
				</button>
			)}
			{inputSource === "demo" && (
				<>
					<label>
						Choose one of these audio clips from the website:{" "}
						<select
							onChange={(ev) => {
								src.value = ev.currentTarget.value;
							}}
						>
							<option disabled selected></option>
							{demoSources.map(([name, newSrc], i) => (
								<option key={i} value={newSrc} selected={src.value === newSrc}>
									{name}
								</option>
							))}
						</select>
					</label>
					<p style={{ marginTop: 0 }}>
						<small>
							These are 128kbps AAC files, so the quality is not great; consider using your own
							audio files instead. You may also need to refresh the page after loading the clip once
							to be able to seek properly.
						</small>
					</p>
				</>
			)}

			<p>
				<strong>Now sit back and enjoy the show!</strong>
			</p>
			<div class={styles["visualizer-app"]} ref={root} tabIndex={0}>
				<div class={styles.content} ref={contentContainer}>
					<VisualizerSelector media={media} class={styles.visualizer} noPause />
					<MediaShortcutResponse animation={mediaAnimation.value} />
				</div>
				<MediaControls
					class={styles.controls}
					media={media}
					mediaRoot={root}
					clickTarget={contentContainer}
					mediaAnimation={mediaAnimation}
				/>
				<audio src={src} ref={audio} />
			</div>
		</>
	);
}
