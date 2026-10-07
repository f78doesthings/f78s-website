/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useContext } from "preact/hooks";

import { OSContext } from "../OSApp";
import { WindowContext } from "../OSWindow";
import { PaigePage } from "../ui/PaigePage";

import styles from "./PreferencesWindow.module.scss";

export function PreferencesWindow() {
	const ctx = useContext(OSContext);
	const { handle } = useContext(WindowContext);

	return (
		<div class={styles["preferences-root"]}>
			<p>
				Only preferences that are relevant to the PaigeOS 2000 project <PaigePage /> are included
				here. Go to the website's{" "}
				<a target="_blank" href="/preferences">
					main preferences page
				</a>{" "}
				for more.
			</p>
			<div class={styles.preferences}>{ctx?.props.preferences}</div>
			<div class="buttons">
				<button id="ok-button" onClick={() => ctx?.closeWindow(handle)}>
					OK
				</button>
			</div>
		</div>
	);
}
