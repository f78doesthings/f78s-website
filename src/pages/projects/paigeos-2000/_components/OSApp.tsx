/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import clsx from "clsx";
import { useEffect, useRef, useState } from "preact/hooks";

import { useEventTarget } from "../../../../scripts/utils/preact";
import Help16 from "../assets/images/16x16/help.webp";
import RecycleBin16 from "../assets/images/16x16/recycle-bin.webp";
import RecycleBin32 from "../assets/images/32x32/recycle-bin.webp";
import Help48 from "../assets/images/48x48/help.webp";
import { DesktopIcon } from "./DesktopIcon";
import { OSWindow, type WindowMetadata, type WindowState } from "./OSWindow";
import { ShutdownOverlay } from "./ShutdownOverlay";
import { StartMenu } from "./taskbar/StartMenu";

import styles from "./OSApp.module.scss";

const getTime = () => new Date().toLocaleTimeString(undefined, { timeStyle: "short" });
const getDate = () => new Date().toLocaleDateString(undefined, { dateStyle: "full" });

// TODO!: - better Recycle Bin/Explorer window
//        - startup/shutdown sequence
const RECYCLE_BIN_WINDOW = (): WindowMetadata => ({
	title: "Recycling Bin",
	icon: RecycleBin16,
	initialPosition: "center",
	initialSize: [640, 400],
	children: (
		<div style={{ paddingInline: 16 }}>
			<p>This folder contains files and folders that you have deleted from your computer.</p>
			<p>There are no items in the Recycle Bin.</p>

			<small>
				<i>I know, I still need to improve this window...</i>
			</small>
		</div>
	),
});

const ABOUT_WINDOW = (): WindowMetadata => ({
	title: "About PaigeOS 2000",
	icon: Help16,
	initialPosition: "center",
	initialSize: [800, 500],
	children: <iframe src={"/projects/paigeos-2000/about"} />,
});

export function OSApp() {
	//#region States

	const [time, setTime] = useState(getTime);
	const [date, setDate] = useState(getDate);
	const [nextHandle, setHandle] = useState(0);
	const [nextZIndex, setZIndex] = useState(0);
	const [windows, setWindows] = useState<WindowState[]>([]);
	const [focused, setFocused] = useState<number>();
	const [prevFocused, setPrevFocused] = useState<number>();
	const [shuttingDown, setShuttingDown] = useState(false);
	const intervalId = useRef<number>();

	//#endregion States

	//#region Helper functions

	const createWindow = (data: WindowMetadata) => {
		// Only log a message in the browser
		if (globalThis.window) {
			console.debug("Creating window", nextHandle, data);
		}

		const props: WindowState = {
			...data,
			handle: nextHandle,
			zIndex: nextZIndex,
			minimized: false,
		};
		setWindows([...windows, props]);
		setPrevFocused(focused);
		setFocused(nextHandle);
		setHandle(nextHandle + 1);
		setZIndex(nextZIndex + 1);
		return props;
	};

	const closeWindow = (props: WindowState) => {
		setWindows(windows.filter((w) => w.handle !== props.handle));
		if (prevFocused) {
			focusWindow();
		}
	};

	const focusWindow = (props?: WindowState) => {
		if (!props) {
			if (!prevFocused) {
				setFocused(undefined);
			}

			props ??= windows.find((w) => w.handle === prevFocused);
			if (!props) {
				return;
			}
		}

		if (focused !== props.handle) {
			props.minimized = false;
			props.zIndex = nextZIndex;
			setPrevFocused(focused);
			setFocused(props.handle);
			setZIndex(nextZIndex + 1);
		}
	};

	const minimizeWindow = (props: WindowState) => {
		props.minimized = true;
		focusWindow();
	};

	//#endregion Helper functions

	//#region Initialization
	useEffect(() => {
		if (nextHandle === 0) {
			createWindow(ABOUT_WINDOW());
		}

		intervalId.current = window.setInterval(() => {
			setTime(getTime);
			setDate(getDate);
		}, 1000);
		return () => window.clearInterval(intervalId.current);
	}, []);

	useEventTarget(
		() => window,
		(on) => {
			on("pointerdown", () => {
				setPrevFocused(focused);
				setFocused(undefined);
			});

			on("message", (ev) => {
				if (ev.origin !== location.origin) {
					return;
				}

				if (ev.data === "clicked") {
					const iframes = document.querySelectorAll("iframe");
					for (const frame of iframes) {
						if (frame.contentWindow === ev.source) {
							const windowElement = frame.closest<HTMLElement>("[data-window-handle]");
							const stringHandle = windowElement?.dataset.windowHandle;
							if (!stringHandle) {
								break;
							}

							const handle = parseInt(stringHandle);
							const props = windows.find((w) => w.handle === handle);
							if (props) {
								focusWindow(props);
							}

							// To close any open menus
							window.dispatchEvent(new PointerEvent("click"));
							break;
						}
					}
				}
			});
		},
	);
	//#endregion Initialization

	return (
		<main class={styles.root}>
			<div class={clsx("desktop", styles.desktop)}>
				<DesktopIcon
					icon={RecycleBin32}
					title="Recycling Bin"
					description="Stores deleted items until you permanently remove them from your computer"
					onClick={() => createWindow(RECYCLE_BIN_WINDOW())}
				/>

				<DesktopIcon
					icon={Help48}
					title="About PaigeOS 2000"
					description="Learn more about the PaigeOS 2000 project"
					onClick={() => createWindow(ABOUT_WINDOW())}
				/>

				{windows.map((props) => (
					<OSWindow
						{...props}
						key={props.handle}
						focused={focused === props.handle}
						onFocus={(ev) => {
							focusWindow(props);
							ev.stopPropagation();
						}}
						onMinimize={() => minimizeWindow(props)}
						onClose={() => closeWindow(props)}
					/>
				))}
			</div>

			<div class={styles.taskbar}>
				<StartMenu onShutdown={() => setShuttingDown(true)} />

				{/* Window list */}
				<div class={styles["window-list"]}>
					{windows.map((props) => (
						<button
							class={clsx(focused === props.handle && styles.focused)}
							onPointerDown={(ev) => ev.stopPropagation()}
							onClick={() => {
								if (focused === props.handle) {
									minimizeWindow(props);
								} else {
									focusWindow(props);
								}
							}}
						>
							{props.icon && <img alt="" class={styles.icon} {...props.icon} />}
							<span class={styles.title}>{props.title}</span>
						</button>
					))}
				</div>

				{/* System tray */}
				<div class={styles["system-tray"]}>
					<div class={styles.clock} title={date}>
						{time}
					</div>
				</div>
			</div>

			{shuttingDown && <ShutdownOverlay onClose={() => setShuttingDown(false)} />}
		</main>
	);
}
