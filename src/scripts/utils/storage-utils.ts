/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { NotUndefined } from "../../types";

export function getStorageItem<T extends NotUndefined>(
	key: string,
	verify: (value: unknown) => value is T,
	storage: Storage = localStorage,
): T | undefined {
	try {
		const json = storage.getItem(key);
		if (!json) {
			return undefined;
		}

		const value = JSON.parse(json);
		if (!verify(value)) {
			return undefined;
		}

		return value;
	} catch (e) {
		console.warn(`Error while getting storage item ${key}:`, e);
		return undefined;
	}
}
