/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { WindowHandle } from "./pages/projects/paigeos-2000/_components/OSWindow";

// oxlint-disable-next-line unicorn/require-module-specifiers
export {};

declare global {
	interface CustomEventMap {
		/** Fired when a preference is changed. */
		"custom:preferences-updated": Event;
	}

	interface OSEvents {
		/** Fired when a window is closed. */
		"window-closed": WindowHandle;
	}

	type OSEventMap = { [K in keyof OSEvents as `os:${K}`]: CustomEvent<OSEvents[K]> };

	interface DocumentEventMap extends CustomEventMap, OSEventMap {}
}
