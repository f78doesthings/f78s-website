/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useState } from "preact/hooks";

import Shutdown32 from "../assets/images/32x32/shutdown-2.webp";
import PaigeOS2000Banner from "../assets/images/PaigeOS2000-banner.webp";
import { OSWindow } from "./OSWindow";
import { Icon } from "./ui/Icon";
import { SelectWrapper } from "./ui/SelectWrapper";

import styles from "./ShutdownOverlay.module.scss";

interface Props {
	onClose: () => void;
}

interface PowerOption {
	title: string;
	description: string;
	action: () => void;
}

export function ShutdownOverlay({ onClose }: Props) {
	// TODO: proper power actions
	const powerOptions: PowerOption[] = [
		{
			title: "Log off Paige",
			description:
				"Ends your session, leaving the computer running on full power. (not implemented)",
			action: () => {},
		},
		{
			title: "Shut down",
			description:
				"Ends your session and shuts down PaigeOS, sending you back to the home page of f78's website.",
			action: () => {
				location.pathname = "/";
			},
		},
		{
			title: "Restart",
			description:
				'Ends your session, shuts down PaigeOS, and starts PaigeOS again. You know, the classic "turn it off and on again".',
			action: () => {
				location.reload();
			},
		},
	];
	const [selectedOption, setSelectedOption] = useState("Shut down");
	const selectedOptionInfo = powerOptions.find((option) => option.title === selectedOption);

	return (
		<div class={styles["shutdown-overlay"]}>
			<div class={styles.backdrop} />
			<OSWindow title="Shut Down PaigeOS" draggable={false} resizable={false} onClose={onClose}>
				<Icon class={styles.banner} {...PaigeOS2000Banner} />
				<div class="gradient-bar" />

				<div class={styles.dialog}>
					<Icon class={styles.icon} {...Shutdown32} />

					<div class={styles.content}>
						<p>What do you want the computer to do?</p>
						<SelectWrapper
							name="power-action"
							onChange={(ev) => setSelectedOption(ev.currentTarget.value)}
						>
							{powerOptions.map((option) => (
								<option selected={selectedOption === option.title}>{option.title}</option>
							))}
						</SelectWrapper>
						<p>{selectedOptionInfo?.description}</p>
					</div>

					<div class="buttons">
						<button onClick={selectedOptionInfo?.action}>OK</button>
						<button onClick={onClose}>Cancel</button>
					</div>
				</div>
			</OSWindow>
		</div>
	);
}
