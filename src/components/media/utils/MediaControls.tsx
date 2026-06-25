/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { Signal, useComputed, useSignal, useSignalEffect } from "@preact/signals";
import { useRef, useState } from "preact/hooks";
import SeekForwardIcon from "~icons/fluent/arrow-clockwise-24-regular";
import SeekBackwardIcon from "~icons/fluent/arrow-counterclockwise-24-regular";
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
import type { MediaShortcutAnimation } from "./MediaShortcutResponse";

import styles from "./MediaControls.module.scss";

interface Props {
	class?: string;

	/** The media element to control. */
	media: Signal<MediaContext | undefined>;

	/** Allows the user to download this media. */
	download?: string;

	/** The element that can be made full screen and needs to be focused in order to enable shortcuts. */
	mediaRoot?: Signal<HTMLElement | null>;

	/** The element that the user must click/tap to trigger click events. */
	clickTarget?: Signal<HTMLElement | null>;

	/** Used to play animations in response to keyboard shortcuts. */
	mediaAnimation?: Signal<MediaShortcutAnimation>;
}

/** Experimental universal controls for media elements. */
export function MediaControls({
	class: className = "",
	media: mediaContext,
	download,
	mediaRoot,
	clickTarget,
	mediaAnimation,
}: Props) {
	const [playing, setPlaying] = useState(false);
	const [looping, setLooping] = useState(false);
	const [volume, setVolume] = useState(0.5);
	const [mutedVolume, setMutedVolume] = useState<number>();
	const [buffered, setBuffered] = useState(0);
	const [time, setTime] = useState(0);

	const ref = useRef<HTMLDivElement>(null);
	const prevScroll = useSignal(0);
	const duration = useSignal(NaN);
	const isFullscreen = useSignal(false);
	const isFocused = useSignal(false);
	const seekMode = useSignal<boolean>();
	const media = useComputed(() => mediaContext.value?.source.mediaElement);

	const playPauseText = playing ? "Pause (Space)" : "Play (Space)";
	const fullscreenText = isFullscreen.value ? "Exit full screen (F)" : "Full screen (F)";
	const muteText = mutedVolume !== undefined ? "Unmute (M)" : "Mute (M)";

	//#region Utility functions

	const playPause = (ev?: Event) => {
		if (!media.value) {
			return;
		}

		const wasPaused = media.value.paused || media.value.ended;
		if (wasPaused) {
			void media.value.play();
		} else {
			media.value.pause();
		}

		if (!ev && mediaAnimation) {
			mediaAnimation.value = {
				icon: wasPaused ? <PlayIcon /> : <PauseIcon />,
				direction: wasPaused ? "grow" : "shrink",
			};
		}
	};

	const toggleMute = (ev?: Event) => {
		if (!mediaContext.value) {
			return;
		}

		const { amplifier } = mediaContext.value;
		const wasMuted = mutedVolume !== undefined;
		if (wasMuted) {
			amplifier.gain.value = mutedVolume;
			setVolume(mutedVolume);
			setMutedVolume(undefined);
		} else {
			setMutedVolume(volume);
			setVolume(0);
			amplifier.gain.value = 0;
		}

		if (!ev && mediaAnimation) {
			mediaAnimation.value = {
				icon: wasMuted ? <HighVolumeIcon /> : <MutedIcon />,
				direction: wasMuted ? "grow" : "shrink",
			};
		}
	};

	const toggleFullscreen = () => {
		const wasFullscreen = isFullscreen.value;
		if (wasFullscreen) {
			document
				.exitFullscreen()
				.then(() => {
					// Correct the browser scrolling to the wrong point
					window.scroll(0, prevScroll.value);
					screen.orientation.unlock();
				})
				.catch(console.error);
		} else if (mediaRoot?.value) {
			prevScroll.value = window.scrollY;
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

		if (mediaAnimation) {
			mediaAnimation.value = {
				icon: (
					<>
						{seconds > 0 ? <SeekForwardIcon /> : <SeekBackwardIcon />}
						<span class={styles["seek-amount"]}>{Math.abs(seconds)}</span>
					</>
				),
				direction: seconds > 0 ? "right" : "left",
			};
		}
	};

	const adjustVolume = (amount: number) => {
		if (!mediaContext.value) {
			return;
		}

		const unmutedVolume = mutedVolume !== undefined ? mutedVolume : volume;
		const newVolume = clamp(unmutedVolume + amount, 0, 1);
		mediaContext.value.amplifier.gain.value = newVolume;
		setVolume(newVolume);
		setMutedVolume(undefined);

		if (mediaAnimation) {
			mediaAnimation.value = {
				icon: amount > 0 ? <HighVolumeIcon /> : <LowVolumeIcon />,
				overlay: `${Math.round(newVolume * 100)}%`,
				direction: amount > 0 ? "up" : "down",
			};
		}
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

	// Crude keyboard shortcut system
	useEventTarget(
		() => window,
		(on) => {
			on("keydown", (ev) => {
				if ((!isFocused.value && !isFullscreen.value) || ev.metaKey || ev.ctrlKey || ev.altKey) {
					return;
				}

				//console.debug("Key code:", ev.code, "| Key:", ev.key);
				let handled = true;
				if (!ev.shiftKey) {
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

	// Crude click handlers
	// TODO: This could probably be improved...
	useEventTarget(
		clickTarget?.value,
		(on) => {
			let lastClick = -1;
			on("pointerup", (ev) => {
				const now = performance.now();
				const isDoubleClick = now - lastClick < 500;
				lastClick = isDoubleClick ? -1 : now;

				ev.preventDefault();
				if (ev.pointerType !== "mouse" && clickTarget?.value) {
					const bounds = clickTarget.value.getBoundingClientRect();
					const xPercent = (ev.clientX - bounds.left) / bounds.width;
					const yPercent = (ev.clientY - bounds.top) / bounds.height;

					if (yPercent < 1 / 4) {
						if (isDoubleClick) adjustVolume(0.1);
						return;
					} else if (yPercent > 3 / 4) {
						if (isDoubleClick) adjustVolume(-0.1);
						return;
					} else if (xPercent < 1 / 3) {
						if (isDoubleClick) seek(-5);
						return;
					} else if (xPercent > 2 / 3) {
						if (isDoubleClick) seek(5);
						return;
					}
				}

				playPause();
				if (isDoubleClick) {
					toggleFullscreen();
				}
			});
		},
		[volume, mutedVolume],
	);

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
		<div ref={ref} class={`${className} ${styles["media-controls"]}`}>
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
						<label>
							{looping ? <LoopOnIcon /> : <LoopOffIcon />}
							Loop
							<input
								type="checkbox"
								checked={looping}
								onChange={() => {
									if (media.value) {
										media.value.loop = !media.value.loop;
									}
								}}
							/>
						</label>
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
