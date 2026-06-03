/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { AnchorHTMLAttributes, ComponentChildren } from "preact";
import FluentOpen16Regular from "~icons/fluent/open-16-regular";

interface Props extends AnchorHTMLAttributes {
	/** If present, marks this link as external. */
	external?: boolean;

	/**
	 * If present, the icon for external links will not be added. This does not affect the
	 * {@linkcode icons} property.
	 */
	noIcon?: boolean;

	/** The link's contents. */
	children?: ComponentChildren;
}

/** A component for simplifying links in text content. */
export default function Link({ external, noIcon, children, ...props }: Props) {
	if (external) {
		props.rel ??= "nofollow noopener noreferrer";
	}

	return (
		<a {...props}>
			{children}
			{external && !noIcon && (
				/* prettier-ignore */ <span class="external-icon"><FluentOpen16Regular /></span>
			)}
		</a>
	);
}
