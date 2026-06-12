/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { Signal, useComputed, useSignal, useSignalEffect } from "@preact/signals";
import { useState } from "preact/hooks";
import DownloadIcon from "~icons/fluent/arrow-download-24-regular";
import LoopOnIcon from "~icons/fluent/arrow-repeat-all-24-regular";
import LoopOffIcon from "~icons/fluent/arrow-repeat-all-off-24-regular";
import EnterFullscreenIcon from "~icons/fluent/full-screen-maximize-24-regular";
import ExitFullscreenIcon from "~icons/fluent/full-screen-minimize-24-regular";
import LowVolumeIcon from "~icons/fluent/speaker-1-24-regular";
import HighVolumeIcon from "~icons/fluent/speaker-2-24-regular";
import MutedIcon from "~icons/fluent/speaker-mute-24-regular";
import PauseIcon from "~icons/ri/pause-large-fill";
import PlayIcon from "~icons/ri/play-large-fill";

import { clamp, formatDuration, getFileName } from "../../../scripts/utils";
import type { MediaContext } from "../../../scripts/utils/audio";
import { useEventTarget } from "../../../scripts/utils/preact";
import { PopupMenu } from "../../utils/PopupMenu";
import { Slider } from "../../utils/Slider";

import styles from "./MediaControls.module.scss";

interface Props {
	class?: string;

	/** The media element to control. */
	media: Signal<MediaContext | undefined>;

	/** Allows the user to download this media. */
	download?: string;

	/** The element that can be made full screen and needs to be focused in order to enable shortcuts. */
	mediaRoot?: Signal<HTMLElement | null>;

	/** @deprecated Will be replaced with {@linkcode mediaRoot} */
	fullscreen?: {
		/** A signal that indicates whether the media is in fullscreen. */
		state: Signal<boolean>;

		/** Called when the fullscreen button is clicked. */
		callback: () => Promise<void>;
	};
}

/** Experimental universal controls for media elements. */
export function MediaControls({
	class: className = "",
	media: mediaContext,
	download,
	mediaRoot,
}: Props) {
	const [playing, setPlaying] = useState(false);
	const [looping, setLooping] = useState(false);
	const [mutedVolume, setMutedVolume] = useState<number>();
	const [volume, setVolume] = useState(0.5);
	const [buffered, setBuffered] = useState(0);
	const [time, setTime] = useState(0);

	const duration = useSignal(NaN);
	const isFullscreen = useSignal(false);
	const isFocused = useSignal(false);
	const seekMode = useSignal<boolean>();

	const playPauseText = playing ? "Pause (Space)" : "Play (Space)";
	const fullscreenText = isFullscreen.value ? "Exit full screen (F)" : "Full screen (F)";
	const muteText = mutedVolume !== undefined ? "Unmute (M)" : "Mute (M)";

	const media = useComputed(() => mediaContext.value?.source.mediaElement);

	//#region Utility functions

	const playPause = () => {
		if (!media.value) {
			return;
		}

		if (media.value.paused || media.value.ended) {
			void media.value.play();
		} else {
			media.value.pause();
		}
	};

	const toggleMute = () => {
		if (!mediaContext.value) {
			return;
		}

		const { amplifier } = mediaContext.value;
		if (mutedVolume !== undefined) {
			amplifier.gain.value = mutedVolume;
			setVolume(mutedVolume);
			setMutedVolume(undefined);
		} else {
			setMutedVolume(volume);
			setVolume(0);
			amplifier.gain.value = 0;
		}
	};

	const toggleFullscreen = () => {
		if (isFullscreen.value) {
			document
				.exitFullscreen()
				.then(() => screen.orientation.unlock())
				.catch(console.error);
		} else if (mediaRoot?.value) {
			mediaRoot.value
				.requestFullscreen()
				.catch(console.error)
				.then(() => screen.orientation.lock("landscape"))
				.catch(() => {}); // ignore errors relating to screen.orientation.lock
		}
	};

	const seek = (seconds: number) => {
		if (media.value) {
			media.value.currentTime += seconds;
		}
	};

	const adjustVolume = (amount: number) => {
		if (!mediaContext.value) {
			return;
		}

		const newVolume = clamp(volume + amount, 0, 1);
		mediaContext.value.amplifier.gain.value = newVolume;
		setVolume(newVolume);
	};

	//#endregion

	//#region Event listeners

	useEventTarget(media.value, (on) => {
		const updatePlayState = () => {
			if (seekMode.value === undefined) {
				const isPlaying = media.value !== undefined && !media.value.paused && !media.value.ended;
				setPlaying(isPlaying);
			}
		};

		const updateTimeCode = () => {
			if (!media.value || seekMode.value) {
				return;
			}

			if (isNaN(duration.value)) {
				duration.value = media.value.duration;
			}

			setTime(media.value.currentTime);
		};

		const updateBufferProgress = () => {
			if (!media.value) {
				return;
			}

			for (let i = 0; i < media.value.buffered.length; i++) {
				if (
					media.value.buffered.start(media.value.buffered.length - 1 - i) < media.value.currentTime
				) {
					setBuffered(media.value.buffered.end(media.value.buffered.length - 1 - i));
					break;
				}
			}
		};

		const updateVolume = () => {
			const amplifier = mediaContext.value?.amplifier;
			if (amplifier) {
				setVolume(amplifier.gain.value);
			}
		};

		on("play", updatePlayState);
		on("pause", updatePlayState);
		on("ended", updatePlayState);
		on("durationchange", updateTimeCode);
		on("timeupdate", updateTimeCode);
		on("progress", updateBufferProgress);
		on("volumechange", updateVolume);

		updatePlayState();
		updateTimeCode();
		updateBufferProgress();
		updateVolume();
		setLooping(media.value?.loop ?? false);
	});

	useEventTarget(
		() => window,
		(on) => {
			on("keydown", (ev) => {
				if (!isFocused.value && !isFullscreen.value) {
					return;
				}

				//console.debug("Key code:", ev.code, "| Key:", ev.key);
				let handled = true;
				switch (ev.code) {
					case "Space":
					case "KeyK":
						playPause();
						break;

					case "KeyF":
						toggleFullscreen();
						break;

					// Volume
					case "ArrowUp":
						adjustVolume(0.05);
						break;
					case "ArrowDown":
						adjustVolume(-0.05);
						break;

					// Seeking
					case "ArrowLeft":
						seek(-5);
						break;
					case "ArrowRight":
						seek(5);
						break;
					case "KeyJ":
						seek(-10);
						break;
					case "KeyL":
						seek(10);
						break;

					default:
						handled = false;
						break;
				}

				if (handled) {
					return ev.preventDefault();
				}

				handled = true;
				switch (ev.key) {
					case "m":
						toggleMute();
						break;

					default:
						handled = false;
						break;
				}

				if (handled) {
					return ev.preventDefault();
				}
			});
		},
	);

	useEventTarget(mediaRoot?.value, (on) => {
		on("focus", () => (isFocused.value = true), true);
		on("blur", () => (isFocused.value = false), true);
		on("fullscreenchange", () => {
			isFullscreen.value =
				mediaRoot !== undefined &&
				mediaRoot.value !== null &&
				document.fullscreenElement === mediaRoot.value;
		});
	});

	useSignalEffect(() => {
		const loopObserver = new MutationObserver(() => {
			setLooping(media.value?.loop ?? false);
		});
		if (media.value) {
			loopObserver.observe(media.value, { attributeFilter: ["loop"] });
		}

		return () => {
			loopObserver.disconnect();
		};
	});

	//#endregion

	return (
		<div class={`${className} ${styles["media-controls"]}`}>
			<Slider
				value={time}
				secondaryValue={buffered}
				max={duration.value}
				onDragStart={() => {
					seekMode.value = playing;
					media.value?.pause();
				}}
				onDragEnd={() => {
					if (media.value && seekMode.value) {
						void media.value.play();
					}
					seekMode.value = undefined;
				}}
				onDrag={({ percent }) => {
					if (!media.value || !isFinite(media.value.duration)) {
						return;
					}

					const newTime = media.value.duration * percent;
					media.value.currentTime = newTime;
					setTime(newTime);
				}}
			/>

			<div class={styles["inner-controls"]}>
				<div class="btn-media-group">
					<button title={playPauseText} aria-label={playPauseText} onClick={playPause}>
						{playing ? <PauseIcon /> : <PlayIcon />}
					</button>
					<button
						class={styles["mute-button"]}
						title={muteText}
						aria-label={muteText}
						onClick={toggleMute}
					>
						{mutedVolume !== undefined || volume <= 0 ? (
							<MutedIcon />
						) : volume >= 0.5 ? (
							<HighVolumeIcon />
						) : (
							<LowVolumeIcon />
						)}
					</button>
					<Slider
						class={styles["volume-slider"]}
						value={volume}
						min={0}
						max={1}
						step={0.01}
						onDrag={({ newValue }) => {
							const amplifier = mediaContext.value?.amplifier;
							if (amplifier) {
								amplifier.gain.value = newValue;
								setVolume(newValue);
								setMutedVolume(undefined);
							}
						}}
					/>
				</div>

				<div class={styles["time-code"]}>
					<span class={styles["current-time"]}>{formatDuration(time)}</span>
					<span class={styles["separator"]}>{" / "}</span>
					<span class={styles["total-time"]}>{formatDuration(duration.value)}</span>
				</div>

				<div class="btn-media-group">
					{mediaRoot?.value && (
						<button title={fullscreenText} aria-label={fullscreenText} onClick={toggleFullscreen}>
							{isFullscreen.value ? <ExitFullscreenIcon /> : <EnterFullscreenIcon />}
						</button>
					)}
					<PopupMenu title="More options">
						<button
							onClick={() => {
								if (media.value) {
									media.value.loop = !media.value.loop;
								}
							}}
						>
							{looping ? <LoopOnIcon /> : <LoopOffIcon />}
							Loop
						</button>
						{download && (
							<a href={download} download={getFileName(download)}>
								<DownloadIcon /> Download
							</a>
						)}
					</PopupMenu>
				</div>
			</div>
		</div>
	);
}
