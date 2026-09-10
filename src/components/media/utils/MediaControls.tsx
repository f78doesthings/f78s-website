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
import RateIncreaseIcon from "~icons/fluent/fast-forward-24-regular";
import EnterFullscreenIcon from "~icons/fluent/full-screen-maximize-24-regular";
import ExitFullscreenIcon from "~icons/fluent/full-screen-minimize-24-regular";
import PlaybackRateIcon from "~icons/fluent/gauge-24-regular";
import RateDecreaseIcon from "~icons/fluent/rewind-24-regular";
import VolumeLowIcon from "~icons/fluent/speaker-1-24-regular";
import VolumeHighIcon from "~icons/fluent/speaker-2-24-regular";
import MutedIcon from "~icons/fluent/speaker-mute-24-regular";
import PauseIcon from "~icons/ri/pause-large-fill";
import PlayIcon from "~icons/ri/play-large-fill";

import { clamp, formatDuration, getFileName, truncate } from "../../../scripts/utils";
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

	/** Whether the user can tap on the click target when using a touchscreen. */
	enableTaps?: Signal<boolean>;

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
	enableTaps,
	clickTarget,
	mediaAnimation,
}: Props) {
	const media = useComputed(() => mediaContext.value?.source.mediaElement);

	const [playing, setPlaying] = useState(false);
	const [looping, setLooping] = useState(false);
	const [volume, setVolume] = useState(0.5);
	const [mutedVolume, setMutedVolume] = useState<number>();
	const [buffered, setBuffered] = useState(0);
	const [time, setTime] = useState(0);
	const [playbackRate, setPlaybackRate] = useState(media.value?.defaultPlaybackRate ?? 1);

	const ref = useRef<HTMLDivElement>(null);
	const prevScroll = useSignal(-1);
	const duration = useSignal(NaN);
	const isFullscreen = useSignal(false);
	const isFocused = useSignal(false);
	const seekMode = useSignal<boolean>();

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
			if (media.value.src || media.value.srcObject) {
				media.value.play().catch((e) => {
					console.warn("Failed to start media playback:", e, media.value);
				});
			}
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
				icon: wasMuted ? <VolumeHighIcon /> : <MutedIcon />,
				direction: wasMuted ? "grow" : "shrink",
			};
		}
	};

	const toggleFullscreen = () => {
		const wasFullscreen = isFullscreen.value;
		if (wasFullscreen) {
			document.exitFullscreen().catch((e) => {
				// This usually errors out if we're not in fullscreen any more for some reason,
				// so we enter fullscreen again
				console.warn("Failed to exit fullscreen, entering it instead:", e);
				isFullscreen.value = false;
				toggleFullscreen();
			});
		} else if (mediaRoot?.value) {
			prevScroll.value = window.scrollY;
			mediaRoot.value.requestFullscreen().catch(console.error);
		}
	};

	const jumpToPercent = (percent: number) => {
		if (media.value) {
			media.value.currentTime = media.value.duration * percent;
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
				icon: amount > 0 ? <VolumeHighIcon /> : <VolumeLowIcon />,
				overlay: `${Math.round(newVolume * 100)}%`,
				direction: amount > 0 ? "up" : "down",
			};
		}
	};

	const adjustPlaybackRate = (amount: number) => {
		if (!media.value) {
			return;
		}

		const newRate = clamp(playbackRate + amount, 0.25, 4, Math.abs(amount));
		media.value.playbackRate = newRate;
		media.value.defaultPlaybackRate = newRate;
		setPlaybackRate(newRate);

		if (mediaAnimation) {
			mediaAnimation.value = {
				icon: amount > 0 ? <RateIncreaseIcon /> : <RateDecreaseIcon />,
				overlay: `${truncate(newRate, 2)}x`,
				direction: amount > 0 ? "right" : "left",
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
			// BUG: I feel like this code is not working as intended...
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

		const initialize = () => {
			duration.value = NaN;
			updatePlayState();
			updateTimeCode();
			updateBufferProgress();
			updateVolume();
			setLooping(media.value?.loop ?? false);
		};

		on("play", updatePlayState);
		on("pause", updatePlayState);
		on("ended", updatePlayState);
		on("durationchange", updateTimeCode);
		on("timeupdate", updateTimeCode);
		on("progress", updateBufferProgress);
		on("volumechange", updateVolume);
		on("loadstart", initialize);
		initialize();

		// If the media is not loaded when we initialize, we force it to.
		// This tends to happen after a page transition.
		if (
			media.value &&
			media.value.src &&
			media.value.networkState === HTMLMediaElement.NETWORK_NO_SOURCE
		) {
			console.debug("Media was not loaded properly, forcing a load", media.value);
			media.value.load();
		}
	});

	// Crude keyboard shortcut system
	useEventTarget(
		() => window,
		(on) => {
			on("keydown", (ev) => {
				if ((!isFocused.value && !isFullscreen.value) || ev.metaKey || ev.ctrlKey || ev.altKey) {
					return;
				}

				if (import.meta.env.DEV) {
					console.debug("Key code:", ev.code, "| Key:", ev.key);
				}

				let handled = true;
				if (ev.shiftKey) {
					switch (ev.code) {
						// Playback speed
						case "KeyM":
							adjustPlaybackRate(-0.25);
							break;
						case "Comma":
							adjustPlaybackRate(0.25);
							break;
					}
				} else {
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

						case "Numpad0":
						case "Digit0":
							jumpToPercent(0);
							break;
						case "Numpad1":
						case "Digit1":
							jumpToPercent(0.1);
							break;
						case "Numpad2":
						case "Digit2":
							jumpToPercent(0.2);
							break;
						case "Numpad3":
						case "Digit3":
							jumpToPercent(0.3);
							break;
						case "Numpad4":
						case "Digit4":
							jumpToPercent(0.4);
							break;
						case "Numpad5":
						case "Digit5":
							jumpToPercent(0.5);
							break;
						case "Numpad6":
						case "Digit6":
							jumpToPercent(0.6);
							break;
						case "Numpad7":
						case "Digit7":
							jumpToPercent(0.7);
							break;
						case "Numpad8":
						case "Digit8":
							jumpToPercent(0.8);
							break;
						case "Numpad9":
						case "Digit9":
							jumpToPercent(0.9);
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
			const fullscreen =
				mediaRoot !== undefined &&
				mediaRoot.value !== null &&
				document.fullscreenElement === mediaRoot.value;
			isFullscreen.value = fullscreen;

			// Attempt to fix the browser erroneously scrolling to a different point in the page
			// BUG: this might not always work, is there a better way?
			//      (also it scrolls down a bit on mobile, likely because of the navbar)
			if (fullscreen) {
				screen.orientation
					.lock("landscape")
					.catch((e) => console.warn("Failed to lock orientation:", e));
			} else {
				const scrollTo = prevScroll.value;
				if (scrollTo >= 0) {
					setTimeout(() => window.scroll(0, scrollTo), 100);
					prevScroll.value = -1;
				}
				screen.orientation.unlock();
			}
		});
	});

	// Crude click handlers
	// TODO: This could probably be improved...
	useEventTarget(
		clickTarget?.value,
		(on) => {
			let prevClickTime = -1;
			let isHolding = false;
			let isDoubleClick = false;
			let tapsSinceBlock = -1;

			on("pointerdown", (ev) => {
				if (ev.button !== 0) {
					return;
				}

				const now = performance.now();
				isDoubleClick = now - prevClickTime < 500;
				prevClickTime = isDoubleClick && tapsSinceBlock !== 0 && tapsSinceBlock !== 1 ? -1 : now;
				isHolding = true;

				if (ev.pointerType !== "mouse") {
					if (enableTaps !== undefined && !enableTaps.value) {
						tapsSinceBlock = 0;
					} else if (!isDoubleClick) {
						tapsSinceBlock = -1;
					} else if (tapsSinceBlock >= 0) {
						tapsSinceBlock++;
					}
				}
			});

			on("pointerup", (ev) => {
				// Additional tap actions on mobile
				if (!isHolding || ev.button !== 0) {
					return;
				}

				isHolding = false;
				ev.preventDefault();

				if (ev.pointerType !== "mouse" && clickTarget?.value) {
					if (tapsSinceBlock === 0) {
						return;
					}

					const bounds = clickTarget.value.getBoundingClientRect();
					const xPercent = (ev.clientX - bounds.left) / bounds.width;
					const yPercent = (ev.clientY - bounds.top) / bounds.height;

					if (yPercent < 1 / 4) {
						if (isDoubleClick && tapsSinceBlock !== 2) adjustVolume(0.1);
						return;
					} else if (yPercent > 3 / 4) {
						if (isDoubleClick && tapsSinceBlock !== 2) adjustVolume(-0.1);
						return;
					} else if (xPercent < 1 / 3) {
						if (isDoubleClick && tapsSinceBlock !== 2) seek(-5);
						return;
					} else if (xPercent > 2 / 3) {
						if (isDoubleClick && tapsSinceBlock !== 2) seek(5);
						return;
					}
				}

				// Common actions
				playPause();
				if (isDoubleClick && (ev.pointerType === "mouse" || tapsSinceBlock !== 1)) {
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
							<VolumeHighIcon />
						) : (
							<VolumeLowIcon />
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
						<label>
							{/* TODO: make this a submenu */}
							<PlaybackRateIcon />
							<span>Playback Speed</span>
							<span class={styles["playback-rate"]}>{truncate(playbackRate, 2)}x</span>
							<Slider
								min={0.25}
								max={4}
								step={0.05}
								value={playbackRate}
								alwaysShowThumb
								onDrag={({ newValue }) => {
									if (media.value) {
										media.value.playbackRate = newValue;
										media.value.defaultPlaybackRate = newValue;
										setPlaybackRate(newValue);
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
