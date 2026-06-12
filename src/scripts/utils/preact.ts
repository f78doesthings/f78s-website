/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// Preact-specific utilities

import { Signal } from "@preact/signals";
import type { Ref, RefCallback } from "preact";
import { useEffect, type Inputs } from "preact/hooks";

export function wrapRefs<T>(
	...refs: (Ref<T> | Signal<T | null> | null | undefined)[]
): RefCallback<T> {
	return (element: T | null) => {
		for (const ref of refs) {
			if (ref instanceof Signal) {
				ref.value = element;
			} else if (typeof ref === "function") {
				ref(element);
			} else if (ref !== undefined && ref !== null) {
				ref.current = element;
			}
		}
	};
}

export function useEventTarget<T extends EventTarget>(
	target: T | null | undefined | (() => T),
	callback: (on: T["addEventListener"]) => void,
	dependencies: Inputs = [],
) {
	useEffect(() => {
		const eventTarget = typeof target === "function" ? target() : target;
		if (!eventTarget) {
			return undefined;
		}

		const events: Parameters<EventTarget["addEventListener"]>[] = [];
		callback((...params) => {
			eventTarget.addEventListener(...params);
			events.push(params);
		});

		return () => {
			for (const params of events) {
				eventTarget.removeEventListener(...params);
			}
		};
	}, [target, ...dependencies]);
}
