/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useState } from "preact/hooks";

export function PaigePage() {
	const [active, setActive] = useState(false);
	return (
		<>
			<span onPointerEnter={() => setActive(true)} onPointerLeave={() => setActive(false)}>
				{active ? "paige" : "page"}
			</span>
		</>
	);
}
