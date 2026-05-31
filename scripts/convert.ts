/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import * as child_process from "node:child_process";
import * as path from "node:path";

import { program } from "@commander-js/extra-typings";

// This script converts an audio or video file for use with this website.

interface Placeholder {
	pattern: RegExp;
	replacement: string;
	required?: boolean;
}

interface Format {
	inputFormats: string[];
	outputCommand: string;
	outputExtension: string;
}

const aacEncoders = ["aac_at", "libfdk_aac", "aac"];

program
	.name("npm run convert --")
	.showHelpAfterError(true)
	.argument("<inputs...>", "The input files to convert.")
	.requiredOption("-o, --output-dir <output>", "The directory to .")
	.option(
		"-a, --aac-encoder <encoder>",
		"The AAC encoder to use. Refer to the FFmpeg AAC encoding guide for more information.\n" +
			'- "aac_at" generally provides the best quality, but is only natively supported on Mac.\n' +
			'- "libfdk_aac" also offers excellent quality and works on all platforms, but is considered "non-free" ' +
			"and therefore not included in some FFmpeg builds.\n" +
			'- "aac" is FFmpeg\'s built-in AAC encoder, and is therefore always available. ' +
			"Unfortunately, its quality tends to be quite poor.",
		"libfdk_aac",
	)
	.option("-F, --ffmpeg-path <path>", 'The path to the "ffmpeg" executable.', "ffmpeg")
	.action((inputPaths, { ffmpegPath: ffmpeg, outputDir, aacEncoder }) => {
		if (!aacEncoders.includes(aacEncoder)) {
			console.error(
				`Unknown AAC encoder "${aacEncoder}". Only the following values are allowed: ${aacEncoders.join(", ")}`,
			);
			return;
		}

		const h264Flags = "-c:v libx264 -crf 28 -preset:v veryslow -profile:v main -pix_fmt yuv420p";
		const aacFlags = `-c:a ${aacEncoder} -b:a 128k -ar 44100 -movflags +faststart`;

		/**
		 * The command to run for each output file type.
		 *
		 * Supports the following placeholders (see `placeholders` below):
		 * - `%f`: The path to the `ffmpeg` executable, followed by `-hide_banner -y`
		 * - `%i`: `-i`, followed by the path to the input file
		 * - `%o`: The path to the output file
		 * - `%%`: A literal `%` character
		 *
		 * If no placeholders are present, the string instead represents output parameters for FFmpeg,
		 * as if it was in the following format: `%f %i VALUE %o`
		 */
		const formats: Format[] = [
			{
				inputFormats: ["mp4", "mkv"],
				outputCommand: `${h264Flags} ${aacFlags}`,
				outputExtension: "mp4",
			},
			{
				inputFormats: ["flac", "wav", "mp3"],
				outputCommand: aacFlags,
				outputExtension: "m4a",
			},
		];

		for (const inputPath of inputPaths) {
			const inputName = path.basename(inputPath);
			const inputType = path.extname(inputName);
			const format = formats.find((other) => other.inputFormats.includes(inputType.substring(1)));
			if (!format) {
				console.error(
					`Expected output file type to be one of ${Object.keys(formats).join(", ")}, but got ${inputType}.`,
				);
				continue;
			}

			const output = path.join(
				outputDir,
				inputName.replace(inputType, `.${format.outputExtension}`),
			);
			const placeholders: Placeholder[] = [
				{
					pattern: /(?<!(?<!%)%)%f/g,
					replacement: `"${ffmpeg}" -hide_banner -y`,
					required: true,
				},
				{
					pattern: /(?<!(?<!%)%)%i/g,
					replacement: `-i "${inputPath}"`,
					required: true,
				},
				{
					pattern: /(?<!(?<!%)%)%o/g,
					replacement: `"${output}"`,
					required: true,
				},
				{
					pattern: /%%/g,
					replacement: "%",
				},
			];

			let command = format.outputCommand;
			for (const { pattern, required } of placeholders) {
				if (required && !pattern.test(command)) {
					command = `%f %i ${command} %o`;
					break;
				}
			}

			for (const { pattern, replacement } of placeholders) {
				command = command.replace(pattern, replacement);
			}

			console.debug(command);
			const result = child_process.spawnSync(command, {
				shell: true,
				stdio: "inherit",
			});
			if (result.error) {
				console.error(result.error);
			}

			if (result.status !== 0) {
				process.exit(result.status ?? 1);
			}
		}
	})
	.parse();
