/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { InputHTMLAttributes, Ref } from "preact";
import { useState } from "preact/hooks";

import styles from "./FilePicker.module.scss";

type Props = Omit<InputHTMLAttributes, "type" | "onChange" | "ref"> & {
	inputRef?: Ref<HTMLInputElement>;

	/**
	 * Called when the user picks some files. The files can be found in {@link CustomEvent.detail}.
	 *
	 * You can call {@link Event.preventDefault} to prevent the displayed file name from being updated.
	 */
	onChange?: (ev: CustomEvent<FileList | null>) => void;
};

/** A file picker field styled for this website. */
export function FilePicker({ onChange, inputRef, children, hidden, ...props }: Props) {
	const [fileName, setFileName] = useState<string>();
	return (
		<div class={styles["file-picker"]} hidden={hidden}>
			<label class="btn">
				<input
					{...props}
					ref={inputRef}
					type="file"
					hidden
					onChange={(ev) => {
						const evCopy = new CustomEvent(ev.type, {
							detail: ev.currentTarget.files,
							cancelable: true,
						});
						try {
							onChange?.(evCopy);
						} catch (e) {
							console.error("Uncaught exception in FilePicker onChange handler:\n", e);
						}
						if (evCopy.defaultPrevented) {
							return;
						}

						const files = ev.currentTarget.files;
						if (!files || files.length === 0) {
							setFileName(undefined);
						} else if (files.length > 1) {
							setFileName(`${files.length} files`);
						} else {
							setFileName(files[0].name);
						}
					}}
				/>
				{children || "Choose file"}
			</label>
			<span>{fileName ?? "No file chosen"}</span>
		</div>
	);
}
