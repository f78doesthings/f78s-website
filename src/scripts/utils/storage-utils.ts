/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

export function getStorageItem<T>(key: string, storage: Storage = localStorage): T | undefined {
	try {
		const json = storage.getItem(key);
		return json ? JSON.parse(json) : undefined;
	} catch (e) {
		console.warn(`Error while getting storage item ${key}:`, e);
	}
}
