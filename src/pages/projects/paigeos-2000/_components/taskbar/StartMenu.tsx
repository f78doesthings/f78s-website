/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import CaretIcon from "~icons/fluent-mdl2/caret-right-solid-8";

import { PopupMenu } from "../../../../../components/ui/PopupMenu";
import Start16 from "../../assets/images/16x16/start.webp";
import Documents32 from "../../assets/images/32x32/documents.webp";
import Help32 from "../../assets/images/32x32/help.webp";
import Programs32 from "../../assets/images/32x32/programs.webp";
import Run32 from "../../assets/images/32x32/run.webp";
import Search32 from "../../assets/images/32x32/search.webp";
import Settings32 from "../../assets/images/32x32/settings.webp";
import Shutdown32 from "../../assets/images/32x32/shutdown.webp";
import StartBanner from "../../assets/images/start-menu-banner.webp";

import styles from "./StartMenu.module.scss";

interface Props {
	onShutdown: () => void;
}

export function StartMenu({ onShutdown }: Props) {
	return (
		<PopupMenu
			class={styles["start-button"]}
			title="Click here to begin"
			content={
				<>
					<img alt="" {...Start16} /> Start
				</>
			}
			align="left"
			trigger="pointerdown"
			noTheme
		>
			<img alt="" class={styles["start-menu-banner"]} {...StartBanner} />

			<button disabled>
				<img alt="" {...Programs32} /> Programs <CaretIcon />
			</button>
			<button disabled>
				<img alt="" {...Documents32} /> Documents <CaretIcon />
			</button>
			<button disabled>
				<img alt="" {...Settings32} /> Settings <CaretIcon />
			</button>
			<button disabled>
				<img alt="" {...Search32} /> Search <CaretIcon />
			</button>
			<button disabled>
				<img alt="" {...Help32} /> Help
			</button>
			<button disabled>
				<img alt="" {...Run32} /> Run...
			</button>

			<hr />
			<button onClick={onShutdown} data-dismisses-popup>
				<img alt="" {...Shutdown32} /> Shut Down...
			</button>
		</PopupMenu>
	);
}
