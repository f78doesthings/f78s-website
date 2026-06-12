/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { VisualizerProps } from "./AudioVisualizer";
import { OscilloscopeVisualizer } from "./OscilloscopeVisualizer";
import { SpectrumVisualizer } from "./SpectrumVisualizer";

import styles from "./CombinedVisualizer.module.scss";

/** A visualizer that combines multiple visualizers themed around audio analysis. */
export function CombinedVisualizer({ class: className = "", ...props }: VisualizerProps) {
	return (
		<div class={`${styles["combined-visualizer"]} ${className}`}>
			<OscilloscopeVisualizer class={styles["oscilloscope"]} {...props} />
			<SpectrumVisualizer class={styles["spectrum"]} {...props} />
		</div>
	);
}
