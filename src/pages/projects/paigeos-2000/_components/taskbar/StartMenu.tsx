/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useContext } from "preact/hooks";
import CaretIcon from "~icons/fluent-mdl2/caret-right-solid-8";

import { PopupMenu } from "../../../../../components/ui/PopupMenu";
import Settings16 from "../../assets/images/16x16/settings.webp";
import Start16 from "../../assets/images/16x16/start.webp";
import Documents32 from "../../assets/images/32x32/documents.webp";
import Help32 from "../../assets/images/32x32/help.webp";
import Programs32 from "../../assets/images/32x32/programs.webp";
import Run32 from "../../assets/images/32x32/run.webp";
import Search32 from "../../assets/images/32x32/search.webp";
import Settings32 from "../../assets/images/32x32/settings.webp";
import Shutdown32 from "../../assets/images/32x32/shutdown.webp";
import StartBanner from "../../assets/images/start-menu-banner.webp";
import { Executables, OSContext } from "../OSApp";
import { PreferencesWindow } from "../programs/PreferencesWindow";
import { Icon } from "../ui/Icon";

import styles from "./StartMenu.module.scss";

interface Props {
	onShutdown: () => void;
}

export function StartMenu({ onShutdown }: Props) {
	const ctx = useContext(OSContext);
	return (
		<PopupMenu
			class={styles["start-button"]}
			title="Click here to begin"
			content={
				<>
					<Icon {...Start16} /> Start
				</>
			}
			align="left"
			trigger="pointerdown"
			noTheme
		>
			<Icon class={styles["start-menu-banner"]} {...StartBanner} />

			<button disabled>
				<Icon {...Programs32} /> Programs <CaretIcon />
			</button>
			<button disabled>
				<Icon {...Documents32} /> Documents <CaretIcon />
			</button>
			<button
				onClick={() => {
					ctx?.createWindow({
						title: "Preferences",
						icon: Settings16,
						isDialog: true,
						children: <PreferencesWindow />,
					});
				}}
			>
				<Icon {...Settings32} /> Preferences
			</button>
			<button disabled>
				<Icon {...Search32} /> Search <CaretIcon />
			</button>
			<button onClick={() => ctx?.execute(Executables.About)}>
				<Icon {...Help32} /> Help
			</button>
			<button disabled>
				<Icon {...Run32} /> Run...
			</button>

			<hr />
			<button onClick={onShutdown}>
				<Icon {...Shutdown32} /> Shut Down...
			</button>
		</PopupMenu>
	);
}
