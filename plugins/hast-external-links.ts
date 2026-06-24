/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { fromHtml } from "hast-util-from-html";
import { defineHastPlugin } from "satteri";

/** Converts the string to a hast {@linkcode Element}. */
function html(...params: Parameters<typeof String.raw>) {
	// Might be a bit crude
	const text = String.raw(...params).trim();
	const tree = fromHtml(text, { fragment: true });
	const element = tree.children.find((child) => child.type === "element");
	if (!element) {
		throw new Error("Failed to parse HTML");
	}

	return element;
}

export function hastExternalLinks() {
	return defineHastPlugin({
		name: "external-links",
		element: {
			filter: ["a"],
			visit(node, ctx) {
				const href = node.properties.href;
				if (typeof href === "string" && href.startsWith("http")) {
					ctx.setProperty(node, "rel", "nofollow noopener noreferrer");
					ctx.appendChild(
						node,
						html`
							<svg
								class="external-icon"
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 16 16"
								data-icon="fluent:open-16-regular"
							>
								<rect width="16" height="16" fill="none" />
								<path
									fill="currentColor"
									d="M4.5 3A1.5 1.5 0 0 0 3 4.5v7A1.5 1.5 0 0 0 4.5 13h7a1.5 1.5 0 0 0 1.5-1.5V9.27a.5.5 0 0 1 1 0v2.23a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 2 11.5v-7A2.5 2.5 0 0 1 4.5 2h2.23a.5.5 0 0 1 0 1zm4.27-.5a.5.5 0 0 1 .5-.5h4.23a.5.5 0 0 1 .5.5v4.23a.5.5 0 0 1-1 0V3.708L9.623 7.084a.5.5 0 1 1-.707-.707L12.293 3H9.269a.5.5 0 0 1-.5-.5"
								/>
							</svg>
						`,
					);
				}
			},
		},
	});
}
