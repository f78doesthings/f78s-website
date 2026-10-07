/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import clsx from "clsx";

import styles from "./MessageBox.module.scss";

export interface MessageBoxData {
	title?: string;
	message: string;
	buttons?: MessageBoxButton;
}

export type MessageBoxButton = (typeof MessageBoxButton)[keyof typeof MessageBoxButton];

export const MessageBoxButton = {
	OK: 0b1,
} as const;

interface MessageBoxProps extends MessageBoxData {
	/** Called when the user clicks a message box button. */
	onResult: (button: MessageBoxButton) => void;
}

export function MessageBox({ message, buttons = MessageBoxButton.OK, onResult }: MessageBoxProps) {
	let hasFocusedButton = false;
	return (
		<div class={styles["message-box"]}>
			<div class={styles.message}>{message}</div>
			<div class={clsx("buttons", styles.buttons)}>
				{Object.entries(MessageBoxButton).map(
					([buttonText, buttonId]) =>
						(buttons & buttonId) !== 0 && (
							<button
								key={buttonId}
								onClick={() => onResult(buttonId)}
								ref={(button) => {
									if (!hasFocusedButton) {
										button?.focus();
										hasFocusedButton = true;
									}
								}}
							>
								{buttonText}
							</button>
						),
				)}
			</div>
		</div>
	);
}
