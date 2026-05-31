/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useEffect, useState } from "preact/hooks";

/** Buttons for the Preferences page. */
export function PreferencesButtons() {
	const [target, setTarget] = useState("/");

	useEffect(() => {
		const from = new URLSearchParams(location.search).get("from");
		if (!from) {
			return;
		}

		if (/^([a-zA-Z][a-zA-Z\d+\-.]*?:)/.test(from)) {
			return console.warn(`?from is an absolute URL, which is not allowed:`, from);
		}

		setTarget(from);
	});

	return (
		<div class="buttons">
			<a href={target} class="btn">
				Apply!
			</a>
		</div>
	);
}
