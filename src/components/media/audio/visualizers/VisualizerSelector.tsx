/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { VisualizerProps } from "./AudioVisualizer";
import { CombinedVisualizer } from "./CombinedVisualizer";

// TODO add preferences for this
export function VisualizerSelector(props: VisualizerProps) {
	return <CombinedVisualizer {...props} />;
}
