/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// Displays a notice of a work's licence.

import { LICENSES, SITE_TITLE } from "../../../consts.tsx";
import type { CopyrightInfo, LicenseType } from "../../../types.ts";
import Link from "../../nav/Link.tsx";

export default function LicenseNotice({
	license,
	createdIn,
	createdBy = SITE_TITLE,
	source,
}: CopyrightInfo) {
	const { icons: Icons = () => undefined, title, type, url } = license ? LICENSES[license] : {};

	const MESSAGES: Record<LicenseType, string> = {
		publicDomain: " Dedicated to the public domain under the ",
		open: " Available under the ",
	};

	const copyrightString =
		type === "publicDomain"
			? `By ${createdBy}${createdIn ? `, ${createdIn}` : ""}.`
			: `${type === "open" ? "🄯" : "©"} ${createdIn ? ` ${createdIn}` : ""} ${createdBy}.`;

	const message = type ? MESSAGES[type] : " All rights reserved.";

	return (
		<p class="license-notice">
			<small>
				{source ? (
					<Link href={source} external>
						{copyrightString}
					</Link>
				) : (
					copyrightString
				)}
				{message}
				{title && url ? (
					<Link href={url} external>
						<Icons /> {title}
					</Link>
				) : (
					title
				)}
				{title && (!/licen[sc]e/i.test(title) ? " licence." : ".")}
			</small>
		</p>
	);
}
