/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { signal } from "@preact/signals";
import clsx from "clsx";
import type { ComponentChildren } from "preact";
import { useContext, useEffect, useState } from "preact/hooks";

import RecycleBin16 from "../../assets/images/16x16/recycle-bin.webp";
import RecycleBin32 from "../../assets/images/32x32/recycle-bin.webp";
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
	description?: () => ComponentChildren;
}

const recycleBinVisits = signal(0);

export const shellFolderInfo: Record<string, ShellFolderInfo | undefined> = {
	[ShellFolders.RecycleBin]: {
		icon16: RecycleBin16,
		icon32: RecycleBin32,
		title: "Recycling Bin",
		description: () => {
			return recycleBinVisits.value > 1
				? "You check the Recycling Bin again. It's still empty. Good."
				: "You look in the Recycling Bin. It's empty. As it should be.";
		},
	},
} satisfies Record<ShellFolders, ShellFolderInfo>;

export function ExplorerProgram({ path: defaultPath }: ExplorerProps) {
	const ctx = useContext(OSContext);
	const { handle } = useContext(WindowContext);

	const [path, setPath] = useState(defaultPath);
	const [nextPath, setNextPath] = useState<string>();
	const [icon, setIcon] = useState<Partial<ImageMetadata>>();
	const [isLoading, setLoading] = useState(true);
	const [history, setHistory] = useState<string[]>([]);

	// TODO: better web URL detection
	const pathLower = path?.toLowerCase();
	const isWeb = path !== undefined && /^https?:\/\//.test(path);
	const shellFolder =
		pathLower && pathLower in shellFolderInfo
			? pathLower
			: Object.entries(shellFolderInfo).find(([, v]) => v?.title.toLowerCase() === pathLower)?.[0];
	const folderInfo = shellFolder ? shellFolderInfo[shellFolder] : undefined;

	useEffect(() => {
		if (nextPath) {
			console.debug("Explorer: Navigating to", nextPath);
			setPath(nextPath);
			setNextPath(undefined);
		}
	}, [nextPath]);

	useEffect(() => {
		if (path && !isWeb && !folderInfo) {
			ctx?.setWindowTitle(handle, path);
			ctx?.setWindowIcon(handle);
			setIcon(undefined);
			setLoading(false);

			void ctx?.messageBox({
				title: path,
				message: `Cannot find the file '${path}' (or one of its components). Make sure the path and filename are correct and that all required libraries are available.`,
			});
		}

		if (shellFolder === ShellFolders.RecycleBin) {
			recycleBinVisits.value++;
		}

		if (isWeb) {
			ctx?.setWindowTitle(handle, "Internet Explorer");
			ctx?.setWindowIcon(handle);
			setIcon(undefined);
		} else if (folderInfo) {
			ctx?.setWindowTitle(handle, folderInfo.title);
			ctx?.setWindowIcon(handle, folderInfo.icon16);
			setIcon(folderInfo.icon16);
			setLoading(false);
		}
	}, [path]);

	return (
		<div class={styles.explorer}>
			<div class={styles.controls}>
				<div class={styles.menubar}>
					<button disabled>File</button>
					<button disabled>Edit</button>
					<button disabled>View</button>
					<button disabled>Favourites</button>
					<button disabled>Tools</button>
					<button disabled>Help</button>
					<div class={styles["loading-indicator"]}>
						<Icon src={isLoading ? LoadingAnimated.src : LoadingStill.src} width={22} height={22} />
					</div>
				</div>
				<div class={clsx(styles["standard-buttons"], "disabled")}>
					{/* TODO: add standard buttons (from browseui.dll) */}
					sorry, I haven't done this part yet
				</div>
				<form
					class={styles["address-bar"]}
					onSubmit={(ev) => {
						ev.preventDefault();
						const formData = new FormData(ev.currentTarget);
						const address = formData.get("search");
						if (typeof address === "string" && address !== "") {
							setLoading(true);
							setHistory([...history, address]);
							setPath(undefined);
							setNextPath(address);
						}
					}}
				>
					Address
					<div class={styles["address"]}>
						<Icon {...icon} />
						<input type="text" name="search" value={folderInfo?.title ?? path} />
					</div>
					<button type="submit">
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

							ctx?.setWindowTitle(handle, `${frameDocument.title} - Internet Explorer`);
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
