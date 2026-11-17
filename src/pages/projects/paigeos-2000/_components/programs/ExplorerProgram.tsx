/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { signal } from "@preact/signals";
import type { ComponentChildren } from "preact";
import { useContext, useEffect, useState } from "preact/hooks";
import CaretDownIcon from "~icons/fluent-mdl2/caret-down-solid-8";

import RecycleBin16 from "../../assets/images/16x16/recycle-bin.webp";
import RecycleBin32 from "../../assets/images/32x32/recycle-bin.webp";
import StandardButtonSpritesheet from "../../assets/images/explorer-icons.webp";
import LoadingAnimated from "../../assets/images/explorer-loading.webp";
import LoadingStill from "../../assets/images/explorer-not-loading.webp";
import GoIcon from "../../assets/images/go.webp";
import { OSContext } from "../OSApp";
import { WindowContext } from "../OSWindow";
import { Icon } from "../ui/Icon";

import styles from "./ExplorerProgram.module.scss";

interface ExplorerProps {
	path?: string;
}

export const enum ShellFolders {
	RecycleBin = "shell:recyclebinfolder",
}

interface ShellFolderInfo {
	icon16: Partial<ImageMetadata>;
	icon32: Partial<ImageMetadata>;
	title: string;
	aliases?: string[];
	description?: () => ComponentChildren;
}

const recycleBinVisits = signal(0);

export const shellFolderInfo: Record<string, ShellFolderInfo | undefined> = {
	[ShellFolders.RecycleBin]: {
		icon16: RecycleBin16,
		icon32: RecycleBin32,
		title: "Recycling Bin",
		aliases: ["recycle bin"],
		description: () => {
			return recycleBinVisits.value > 1
				? "You check the Recycling Bin again. It's still empty. Good."
				: "You look in the Recycling Bin. It's empty. As it should be.";
		},
	},
} satisfies Record<ShellFolders, ShellFolderInfo>;

interface ExplorerIconProps {
	index: number;
	spritesheet?: ImageMetadata;
}

function ExplorerIcon({ index, spritesheet = StandardButtonSpritesheet }: ExplorerIconProps) {
	const spriteSize = spritesheet.height;
	const numSprites = spritesheet.width / spriteSize;
	return (
		<img
			{...spritesheet}
			alt=""
			class={styles.sprite}
			style={{
				objectPosition: `${(index / (numSprites - 1)) * 100}% 0`,
			}}
			width={spriteSize}
			height={spriteSize}
		/>
	);
}

function resolvePath(path: string | undefined) {
	const pathLower = path?.toLowerCase();

	// Not ideal, but whatever. HTTP is not supported if the source site is HTTPS,
	// hence why we only check for HTTPS here.
	const isWeb = pathLower?.startsWith("https://");
	const shellFolder =
		pathLower && pathLower in shellFolderInfo
			? pathLower
			: Object.entries(shellFolderInfo).find(
					([, folder]) =>
						folder?.title.toLowerCase() === pathLower ||
						folder?.aliases?.some((alias) => alias.toLowerCase() === pathLower),
				)?.[0];
	const folderInfo = shellFolder ? shellFolderInfo[shellFolder] : undefined;
	let realPath = shellFolder ?? path;
	const toText = realPath ? ` to ${folderInfo?.title ?? realPath}` : "";

	return { isWeb, realPath, folderInfo, toText };
}

export function ExplorerProgram({ path: defaultPath }: ExplorerProps) {
	//#region State

	const ctx = useContext(OSContext);
	const { handle } = useContext(WindowContext);

	const [path, setPath] = useState(defaultPath);
	const [nextPath, setNextPath] = useState<string>();
	const [icon, setIcon] = useState<Partial<ImageMetadata>>();
	const [isLoading, setLoading] = useState(true);
	const [history, setHistory] = useState<string[]>(defaultPath ? [defaultPath] : []);
	const [historyIndex, setHistoryIndex] = useState(0);
	const [address, setAddress] = useState<string>();

	const { isWeb: nextIsWeb, realPath, folderInfo } = resolvePath(path);
	const { toText: backText } = resolvePath(history[historyIndex - 1]);
	const { toText: forwardText } = resolvePath(history[historyIndex + 1]);

	// This state is used to prevent the standard buttons from flashing
	const [isWeb, setIsWeb] = useState(nextIsWeb);

	//#endregion

	//#region Helper functions

	const navigateHistory = (direction: number) => {
		const newIndex = historyIndex + direction;
		setLoading(true);
		setHistoryIndex(newIndex);
		setPath(undefined);
		setNextPath(history[newIndex]);
	};

	const navigateTo = (newPath: string | undefined) => {
		if (!newPath) {
			return;
		}

		setLoading(true);
		if (path !== newPath) {
			setHistory((prevHistory) => [...prevHistory.slice(0, historyIndex + 1), newPath]);
			setHistoryIndex((prevIndex) => prevIndex + 1);
		}
		setPath(undefined);
		setNextPath(newPath);
	};

	//#endregion

	//#region Effects

	useEffect(() => {
		if (nextPath) {
			console.debug("Explorer: Navigating to", nextPath, "\n", history, historyIndex);
			setPath(nextPath);
			setNextPath(undefined);
		}
	}, [nextPath]);

	useEffect(() => {
		setAddress(folderInfo?.title ?? path);
		if (path) {
			setIsWeb(nextIsWeb);
		}

		if (realPath === ShellFolders.RecycleBin) {
			recycleBinVisits.value++;
		}

		if (nextIsWeb) {
			ctx?.setWindowTitle(handle, "PaigeOS Internet Explorer");
			ctx?.setWindowIcon(handle);
			setIcon(undefined);
		} else if (folderInfo) {
			ctx?.setWindowTitle(handle, folderInfo.title);
			ctx?.setWindowIcon(handle, folderInfo.icon16);
			setIcon(folderInfo.icon16);
			setLoading(false);
		} else if (path) {
			ctx?.setWindowTitle(handle, path);
			ctx?.setWindowIcon(handle);
			setIcon(undefined);
			setLoading(false);

			void ctx?.messageBox({
				title: "Sorry!",
				message: `The path '${path}' is not available in this simulation.`,
			});
		}
	}, [path]);

	//#endregion

	return (
		<div class={styles.explorer}>
			<div class={styles.controls}>
				<div class={styles.menubar}>
					<div class={styles.menus}>
						<button disabled>File</button>
						<button disabled>Edit</button>
						<button disabled>View</button>
						<button disabled>Favourites</button>
						<button disabled>Tools</button>
						<button disabled>Help</button>
					</div>
					<div class={styles["loading-indicator"]}>
						<Icon src={isLoading ? LoadingAnimated.src : LoadingStill.src} width={22} height={22} />
					</div>
				</div>
				<div class={styles["standard-buttons"]}>
					<button
						disabled={!backText}
						title={"Back" + backText}
						onClick={() => navigateHistory(-1)}
					>
						<ExplorerIcon index={0} /> <span>Back</span>
						<CaretDownIcon class="disabled" />
					</button>
					<button
						disabled={!forwardText}
						onClick={() => navigateHistory(1)}
						title={"Forward" + forwardText}
					>
						<ExplorerIcon index={1} />
						<CaretDownIcon class="disabled" />
					</button>
					{isWeb ? (
						<>
							<button disabled title="Stop">
								<ExplorerIcon index={11} />
							</button>
							<button title="Refresh" onClick={() => navigateTo(path)}>
								<ExplorerIcon index={12} />
							</button>
							<button
								title="Home"
								onClick={() => navigateTo(new URL(import.meta.env.BASE_URL, location.origin).href)}
							>
								<ExplorerIcon index={13} />
							</button>
						</>
					) : (
						<>
							<button disabled title="Up">
								<ExplorerIcon index={2} />
							</button>
						</>
					)}
					<hr />

					<button disabled>
						<ExplorerIcon index={3} />
						<span>Search</span>
					</button>
					{isWeb ? (
						<>
							<button disabled>
								<ExplorerIcon index={14} />
								<span>Favorites</span>
							</button>
							<button disabled>
								<ExplorerIcon index={15} />
								<span>Media</span>
							</button>
						</>
					) : (
						<>
							<button disabled>
								<ExplorerIcon index={4} />
								<span>Folders</span>
							</button>
						</>
					)}
					<button disabled title="History">
						<ExplorerIcon index={5} />
					</button>
					<hr />

					{isWeb ? (
						<>
							<button disabled title="Mail">
								<ExplorerIcon index={16} />
								<CaretDownIcon />
							</button>
							<button disabled title="Print">
								<ExplorerIcon index={17} />
							</button>
						</>
					) : (
						<>
							<button disabled title="Move To">
								<ExplorerIcon index={6} />
							</button>
							<button disabled title="Copy To">
								<ExplorerIcon index={7} />
							</button>
							<button disabled title="Delete">
								<ExplorerIcon index={8} />
							</button>
							<button disabled title="Undo">
								<ExplorerIcon index={9} />
							</button>
							<hr />
							<button disabled title="Views">
								<ExplorerIcon index={10} />
								<CaretDownIcon />
							</button>
						</>
					)}
				</div>
				<form
					class={styles["address-bar"]}
					onSubmit={(ev) => {
						ev.preventDefault();
						const { realPath: realAddress } = resolvePath(address);
						navigateTo(realAddress);
					}}
				>
					Address
					<div class={styles["address"]}>
						<Icon {...icon} />
						<input
							type="text"
							name="search"
							value={address}
							onInput={(ev) => setAddress(ev.currentTarget.value)}
						/>
					</div>
					<button type="submit" title={`Go to "${address}"`}>
						<Icon {...GoIcon} /> Go
					</button>
					<input type="submit" hidden />
				</form>
			</div>

			<div class={styles.content}>
				{isWeb ? (
					<iframe
						src={path}
						onLoad={(ev) => {
							setLoading(false);

							const frameDocument = ev.currentTarget.contentDocument;
							if (!frameDocument) {
								return console.warn(
									"Explorer: Cannot display document icon/title due to cross-origin policy",
									ev.currentTarget,
								);
							}

							ctx?.setWindowTitle(handle, `${frameDocument.title} - PaigeOS Internet Explorer`);
							const frameIcon = frameDocument.querySelector<HTMLLinkElement>("link[rel=icon]");
							if (frameIcon) {
								setIcon({
									src: frameIcon.href,
									width: 16,
									height: 16,
								});
							}
						}}
					/>
				) : (
					folderInfo && (
						<div class={styles.sidebar}>
							<Icon {...folderInfo.icon32} />
							<h2>{folderInfo.title}</h2>
							{folderInfo.description?.()}
						</div>
					)
				)}
			</div>

			<table class={styles.statusbar}>
				<tbody>
					<tr>
						<td>{isLoading ? "Loading" : "Done"}</td>
						<td>{isWeb ? "Internet" : "My Computer"}</td>
					</tr>
				</tbody>
			</table>
		</div>
	);
}
