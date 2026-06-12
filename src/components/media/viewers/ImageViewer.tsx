/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useState } from "preact/hooks";
import FluentErrorCircle48Regular from "~icons/fluent/error-circle-48-regular";

import { MediaViewer, registerMedia, type MediaProps } from "./MediaViewer";

import styles from "./ImageViewer.module.scss";

interface Props extends MediaProps {
	alt: string;
	width: number;
	height: number;
}

// TODO: image zooming and panning
function InnerImageViewer(props: Props) {
	const { children: _children, ...imgProps } = props;
	const [supported, setSupported] = useState(true);

	return (
		<MediaViewer props={props}>
			{supported && <img class={styles.image} {...imgProps} onError={() => setSupported(false)} />}
			{!supported && (
				<div class={styles.error}>
					<FluentErrorCircle48Regular />
					<p>Failed to load image. Your browser may not support this image format.</p>
					<small>You can still download it from the download button at the top.</small>
				</div>
			)}
		</MediaViewer>
	);
}

export function ImageViewer(props: Props) {
	return registerMedia(props, InnerImageViewer);
}
