/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

type Callback = (...args: unknown[]) => unknown;

interface WithTools {
	tools: typeof tools;
}

const tools: Record<string, Callback> = {};

// I don't really want to use "declare global" here
((global: WithTools) => {
	global.tools = tools;
})(
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	globalThis as unknown as WithTools,
);

/**
 * Defines a function that can be accessed through the global {@linkcode Window.tools tools} object
 * in the Dev Tools console.
 */
export function defineDevTool(name: string, callback: Callback) {
	tools[name] = callback;
}
