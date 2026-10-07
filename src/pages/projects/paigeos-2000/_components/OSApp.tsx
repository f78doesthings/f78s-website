/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// oxlint-disable typescript/no-unsafe-enum-comparison

import { useSignal } from "@preact/signals";
import clsx from "clsx";
import { createContext, type ComponentChildren } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";

import { loadPreferences } from "../../../../scripts/preferences/client";
import { useEventTarget } from "../../../../scripts/utils/preact";
import Help16 from "../assets/images/16x16/help.webp";
import RecycleBin16 from "../assets/images/16x16/recycle-bin.webp";
import RecycleBin32 from "../assets/images/32x32/recycle-bin.webp";
import Help48 from "../assets/images/48x48/help.webp";
import { DesktopIcon } from "./DesktopIcon";

import "../styles/os-styles.scss";
import { MessageBox, type MessageBoxButton, type MessageBoxData } from "./MessageBox";
import { OSWindow, type WindowHandle, type WindowMetadata, type WindowState } from "./OSWindow";
import { ExplorerProgram, ShellFolders } from "./programs/ExplorerProgram";
import { ShutdownOverlay } from "./ShutdownOverlay";
import { StartMenu } from "./taskbar/StartMenu";
import { Icon } from "./ui/Icon";

import styles from "./OSApp.module.scss";

const getTime = () => new Date().toLocaleTimeString(undefined, { timeStyle: "short" });
const getDate = () => new Date().toLocaleDateString(undefined, { dateStyle: "full" });

interface OSAppProps {
	preferences?: ComponentChildren;
}

interface OSExecutable {
	aliases: string[];
	execute: (ctx: OSContext) => void;
}

interface OSContext {
	readonly props: Readonly<OSAppProps>;

	/** Executes a command. */
	execute(path: string): void;

	/** Creates a window. */
	createWindow(data: WindowMetadata): WindowHandle;

	/** Shows a message box to the user, and resolves with the button that was pressed (if any). */
	messageBox(data: MessageBoxData): Promise<MessageBoxButton | undefined>;

	/** Brings a window to the front and focuses it. */
	focusWindow(handle: WindowHandle, force?: boolean): void;

	/** Minimizes a window. Use {@linkcode focusWindow} to restore it. */
	minimizeWindow(handle: WindowHandle): void;

	/** Closes a window. */
	closeWindow(handle?: WindowHandle): void;

	/** Changes the title of a window. */
	setWindowTitle(handle?: WindowHandle, title?: string): void;

	/** Changes the icon of a window. */
	setWindowIcon(handle?: WindowHandle, icon?: Partial<ImageMetadata>): void;
}

export const OSContext = createContext<OSContext | undefined>(undefined);

// TODO: startup/shutdown sequence
const RECYCLE_BIN_WINDOW = (): WindowMetadata => ({
	title: "Recycling Bin",
	icon: RecycleBin16,
	initialSize: [600, 400],
	children: <ExplorerProgram path={ShellFolders.RecycleBin} />,
});

const ABOUT_WINDOW = (): WindowMetadata => ({
	title: "About PaigeOS 2000",
	icon: Help16,
	initialSize: [800, 500],
	children: <iframe src="/projects/paigeos-2000/about" />,
});

const emitOSEvent = <K extends keyof OSEvents>(event: K, data: OSEvents[K]) =>
	document.dispatchEvent(new CustomEvent(`os:${event}`, { detail: data }));

export const enum Executables {
	About = "about",
}

const executables: OSExecutable[] = [
	{
		aliases: [Executables.About, "welcome", "hh"],
		execute: (ctx) => ctx.createWindow(ABOUT_WINDOW()),
	},
];

export function OSApp(props: OSAppProps) {
	//#region States

	const [time, setTime] = useState(getTime);
	const [date, setDate] = useState(getDate);
	const [nextHandle, setHandle] = useState(1);
	const [nextZIndex, setZIndex] = useState(0);
	const [windows, setWindows] = useState<WindowState[]>([]);
	const [shuttingDown, setShuttingDown] = useState(false);

	const focused = useSignal<number>();
	const prevFocused = useSignal<number>();

	const intervalId = useRef<number>();

	//#endregion States

	//#region Helper functions

	const ctx: OSContext = {
		props,

		execute(path) {
			const executableName = path.toLowerCase().replace(/\.exe$/, "");
			const executable = executables.find((v) => v.aliases.includes(executableName));
			console.debug("execute", path, executable);

			if (executable) {
				executable.execute(this);
			} else {
				void ctx?.messageBox({
					title: path,
					message: `The path '${path}' does not exist in this simulation.`,
				});
			}
		},

		createWindow(data) {
			console.debug("createWindow", nextHandle, data, "\n\tfocused:", focused.value);

			const state: WindowState = {
				...data,
				handle: nextHandle,
				zIndex: nextZIndex,
				minimized: false,
			};

			setWindows([...windows, state]);
			prevFocused.value = focused.value;
			focused.value = nextHandle;
			setHandle(nextHandle + 1);
			setZIndex(nextZIndex + 1);

			return state.handle;
		},

		messageBox(data) {
			return new Promise((resolve) => {
				const returnResult = (result?: MessageBoxButton) => {
					console.debug("Message box", handle, "result:", result);
					document.removeEventListener("os:window-closed", onWindowClosed);
					resolve(result);
				};

				const onWindowClosed = (ev: CustomEvent<WindowHandle>) => {
					if (ev.detail === handle) {
						returnResult();
					}
				};

				const handle = this.createWindow({
					isDialog: true,
					title: data.title,
					children: (
						<MessageBox
							{...data}
							onResult={(result) => {
								returnResult(result);
								this.closeWindow(handle);
							}}
						/>
					),
				});
				document.addEventListener("os:window-closed", onWindowClosed);
			});
		},

		closeWindow(handle) {
			if (handle === undefined) {
				return;
			}

			console.debug("closeWindow", handle, "\n\tprevFocused:", prevFocused.value);
			setWindows(windows.filter((w) => w.handle !== handle));
			emitOSEvent("window-closed", handle);

			if (prevFocused.value) {
				this.focusWindow(prevFocused.value);
			}
		},

		focusWindow(handle, force) {
			console.debug("focusWindow", handle, "\n\tfocused:", focused.value);

			updateWindow(handle, (wnd) => {
				if (focused.value === handle) {
					return undefined;
				}

				if (wnd.minimized && !force) {
					focused.value = undefined;
					return undefined;
				}

				wnd.minimized = false;
				wnd.zIndex = nextZIndex;
				prevFocused.value = focused.value;
				focused.value = wnd.handle;
				setZIndex(nextZIndex + 1);

				return {
					minimized: false,
					zIndex: nextZIndex,
				};
			});
		},

		minimizeWindow(handle) {
			console.debug("minimizeWindow", handle, "\n\tprevFocused:", prevFocused.value);
			updateWindow(handle, () => {
				if (prevFocused.value && prevFocused.value !== handle) {
					this.focusWindow(prevFocused.value);
				} else {
					// To make sure we re-render properly
					focused.value = undefined;
				}

				return { minimized: true };
			});
		},

		setWindowTitle(handle, title) {
			updateWindow(handle, () => ({ title }));
		},

		setWindowIcon(handle, icon) {
			updateWindow(handle, () => ({ icon }));
		},
	};

	const updateWindow = (
		handle: WindowHandle | undefined,
		updater: (state: WindowState) => Partial<WindowState> | undefined,
	) => {
		setWindows((windowList) =>
			windowList.map((w) => (w.handle === handle ? { ...w, ...updater(w) } : w)),
		);
	};

	//#endregion Helper functions

	//#region Initialization

	useEffect(() => {
		document.documentElement.classList.add("loaded");
		if (nextHandle === 1) {
			ctx.createWindow(import.meta.env.DEV ? RECYCLE_BIN_WINDOW() : ABOUT_WINDOW());
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
				prevFocused.value = focused.value;
				focused.value = undefined;
			});

			on("message", (ev) => {
				if (ev.origin !== location.origin) {
					return;
				}

				switch (ev.data) {
					case "os:focus":
					case "os:close":
						for (const frame of document.querySelectorAll("iframe")) {
							if (frame.contentWindow !== ev.source) {
								continue;
							}

							const windowElement = frame.closest<HTMLElement>("[data-window-handle]");
							const stringHandle = windowElement?.dataset.windowHandle;
							if (!stringHandle) {
								break;
							}

							const handle = parseInt(stringHandle);
							if (ev.data === "os:close") {
								ctx.closeWindow(handle);
							} else {
								ctx.focusWindow(handle);
								// To close any open menus (kind of a hack)
								window.dispatchEvent(new PointerEvent("click"));
							}
							break;
						}
						break;

					case "custom:preferences-updated":
						loadPreferences();
						break;
				}
			});
		},
	);

	//#endregion Initialization

	return (
		<OSContext.Provider value={ctx}>
			<main class={styles.root}>
				<div class={clsx("desktop", styles.desktop)}>
					<DesktopIcon
						icon={RecycleBin32}
						title="Recycling Bin"
						description="Stores deleted items until you permanently remove them from your computer"
						onClick={() => ctx.createWindow(RECYCLE_BIN_WINDOW())}
					/>
					<DesktopIcon
						icon={Help48}
						title="About PaigeOS 2000"
						description="Learn more about the PaigeOS 2000 project"
						onClick={() => ctx.createWindow(ABOUT_WINDOW())}
					/>

					{windows.map((wnd) => (
						<OSWindow
							{...wnd}
							key={wnd.handle}
							focused={focused.value === wnd.handle}
							onFocus={(ev) => {
								ctx.focusWindow(wnd.handle);
								ev.stopPropagation();
							}}
							onMinimize={wnd.isDialog ? undefined : () => ctx.minimizeWindow(wnd.handle)}
							onClose={() => ctx.closeWindow(wnd.handle)}
						/>
					))}
				</div>

				<div class={styles.taskbar}>
					<StartMenu onShutdown={() => setShuttingDown(true)} />

					{/* Window list */}
					<div class={styles["window-list"]}>
						{windows.map(
							(wnd) =>
								!wnd.isDialog && (
									<button
										class={clsx(focused.value === wnd.handle && styles.focused)}
										onPointerDown={(ev) => ev.stopPropagation()}
										onClick={() => {
											if (focused.value === wnd.handle) {
												ctx.minimizeWindow(wnd.handle);
											} else {
												ctx.focusWindow(wnd.handle, true);
											}
										}}
									>
										{wnd.icon && <Icon class={styles.icon} {...wnd.icon} />}
										<span class={styles.title}>{wnd.title}</span>
									</button>
								),
						)}
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
		</OSContext.Provider>
	);
}
