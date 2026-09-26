/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Shutdown32 from "../assets/images/32x32/shutdown-2.webp";
import PaigeOS2000Banner from "../assets/images/PaigeOS2000-banner.webp";
import { OSWindow } from "./OSWindow";
import { SelectWrapper } from "./ui/SelectWrapper";

import styles from "./ShutdownOverlay.module.scss";

interface Props {
	onClose: () => void;
}

export function ShutdownOverlay({ onClose }: Props) {
	return (
		<div class={styles["shutdown-overlay"]}>
			<div class={styles.backdrop} />
			<OSWindow
				title="Shut Down PaigeOS"
				initialPosition="center"
				draggable={false}
				resizable={false}
				onClose={onClose}
			>
				<img alt="" class={styles.banner} {...PaigeOS2000Banner} />
				<div class="gradient-bar" />

				<div class={styles.dialog}>
					<img alt="" class={styles.icon} {...Shutdown32} />

					<div class={styles.content}>
						<p>What do you want the computer to do?</p>
						<SelectWrapper name="power-action" disabled>
							<option selected>Shut down</option>
						</SelectWrapper>
						<p>Ends your session and shuts down PaigeOS so that you can safely turn off power.</p>
						<small>You will be sent back to the home page of f78's website.</small>
					</div>

					<div class={styles.buttons}>
						<a class="button" href="/">
							OK
						</a>
						<button onClick={onClose}>Cancel</button>
					</div>
				</div>
			</OSWindow>
		</div>
	);
}
