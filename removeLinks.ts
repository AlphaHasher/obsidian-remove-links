function isInternalLink(url: string): boolean {
	const trimmedUrl = url.trim();

	if (trimmedUrl.match(/^https?:\/\//i)) {
		return false;
	}

	// ftp, mailto, etc
	if (trimmedUrl.match(/^[a-z][a-z0-9+.-]*:/i)) {
		return false;
	}

	// Everything else is considered internal
	return true;
}

export interface EmbedTypeOptions {
	images: boolean;
	base: boolean;
	canvas: boolean;
	pdf: boolean;
	audioVideo: boolean;
	notes: boolean;
}

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp', 'avif'];
const AUDIO_VIDEO_EXTENSIONS = ['mp3', 'wav', 'm4a', 'ogg', '3gp', 'flac', 'opus', 'aac', 'webm', 'mp4', 'ogv', 'mov', 'mkv'];

export function getEmbedCategory(path: string): keyof EmbedTypeOptions {
	let normalized = path.trim();

	// Strip surrounding angle brackets (markdown <path with spaces> form)
	if (normalized.startsWith('<') && normalized.endsWith('>')) {
		normalized = normalized.slice(1, -1);
	}

	// Decode URL-encoded paths (e.g. %20)
	try {
		normalized = decodeURIComponent(normalized);
	} catch {
		// Keep as-is if decoding fails
	}

	// Strip alias (|) and subpath (#)
	const pipeIndex = normalized.indexOf('|');
	if (pipeIndex !== -1) {
		normalized = normalized.substring(0, pipeIndex);
	}
	const hashIndex = normalized.indexOf('#');
	if (hashIndex !== -1) {
		normalized = normalized.substring(0, hashIndex);
	}

	const dotIndex = normalized.lastIndexOf('.');
	if (dotIndex === -1 || dotIndex === normalized.length - 1) {
		return 'notes';
	}

	const extension = normalized.substring(dotIndex + 1).toLowerCase();

	if (IMAGE_EXTENSIONS.includes(extension)) {
		return 'images';
	}
	if (AUDIO_VIDEO_EXTENSIONS.includes(extension)) {
		return 'audioVideo';
	}
	if (extension === 'pdf') {
		return 'pdf';
	}
	if (extension === 'base') {
		return 'base';
	}
	if (extension === 'canvas') {
		return 'canvas';
	}

	return 'notes';
}

export function removeCitations(text: string): string {
	// Matches AI-generated citation links: an outer [ ... ] wrapping one or more
	// markdown links [label](url) separated by commas.
	// e.g. [[1](url)] and [[1](url), [2](url)]
	const citationRegex = /\[(?:\[[^\]]*\]\([^)]*\)(?:\s*,\s*\[[^\]]*\]\([^)]*\))*)\]/g;
	return text.replace(citationRegex, '');
}

export function removeWikipediaCitations(text: string): string {
	// Removes Wikipedia-style footnotes, e.g. "Text.[[2]](url)" -> "Text."
	const citationRegex = /\[\[\d+\]\]\([^)]*\)/g;
	return text.replace(citationRegex, '');
}

export function removeHyperlinks(text: string, keepText: boolean, whitelist: string[] = [], linkType: 'both' | 'internal' | 'external' = 'both', blacklistMode: boolean = false, blacklist: string[] = [], embedTypes?: EmbedTypeOptions): string {
	let result = '';
	let i = 0;

	while (i < text.length) {
		// Check for wikilink patterns first
		if (text[i] === '[' && i + 1 < text.length && text[i + 1] === '[') {
			// This is a wikilink, find the end and copy as-is
			let j = i + 2;
			let bracketCount = 2;

			while (j < text.length && bracketCount > 0) {
				if (text[j] === '[') {
					bracketCount++;
				} else if (text[j] === ']') {
					bracketCount--;
				}
				j++;
			}

			// Copy the entire wikilink as-is
			result += text.slice(i, j);
			i = j;
			continue;
		}

		// Check for image embed patterns
		if (text[i] === '!' && i + 1 < text.length && text[i + 1] === '[' && i + 2 < text.length && text[i + 2] === '[') {
			// This is an image embed, find the end and copy as-is
			let j = i + 3;
			let bracketCount = 2;

			while (j < text.length && bracketCount > 0) {
				if (text[j] === '[') {
					bracketCount++;
				} else if (text[j] === ']') {
					bracketCount--;
				}
				j++;
			}

			// Copy the entire image embed as-is
			result += text.slice(i, j);
			i = j;
			continue;
		}

		// Check for markdown link patterns
		const isImage = text[i] === '!' && i + 1 < text.length && text[i + 1] === '[';
		const linkStart = isImage ? i + 1 : i;

		if (text[linkStart] === '[') {
			// Look for the closing ] followed by (
			let j = linkStart + 1;
			let bracketCount = 1;
			let linkText = '';

			// Find the matching closing bracket
			while (j < text.length && bracketCount > 0) {
				if (text[j] === '[' && text[j - 1] !== '\\') {
					bracketCount++;
				} else if (text[j] === ']' && text[j - 1] !== '\\') {
					bracketCount--;
				}

				if (bracketCount > 0) {
					linkText += text[j];
				}
				j++;
			}

			// Check if this is followed by an opening parenthesis
			if (j < text.length && text[j] === '(') {
				// Find the matching closing parenthesis
				let k = j + 1;
				let parenCount = 1;
				let url = '';

				while (k < text.length && parenCount > 0) {
					if (text[k] === '(') {
						parenCount++;
					} else if (text[k] === ')') {
						parenCount--;
					}

					if (parenCount > 0) {
						url += text[k];
					}
					k++;
				}

				if (parenCount === 0) {
					// Check blacklist/whitelist logic
					if (blacklistMode) {
						// In blacklist mode, only remove if URL matches blacklist
						const isBlacklisted = blacklist.some(blacklistItem =>
							url.toLowerCase().includes(blacklistItem.toLowerCase())
						);

						if (!isBlacklisted) {
							// Keep the entire link if not blacklisted
							result += text.slice(i, k);
							i = k;
							continue;
						}
					} else {
						// Whitelist mode - check if URL is in whitelist
						const isWhitelisted = whitelist.some(whitelistItem =>
							url.toLowerCase().includes(whitelistItem.toLowerCase())
						);

						if (isWhitelisted) {
							// Keep the entire link if whitelisted
							result += text.slice(i, k);
							i = k;
							continue;
						}
					}

					// Check link type filter (blacklist mode ignores)
					if (!blacklistMode) {
						const urlIsInternal = isInternalLink(url);
						const shouldRemove = linkType === 'both' ||
							(linkType === 'internal' && urlIsInternal) ||
							(linkType === 'external' && !urlIsInternal);

						if (!shouldRemove) {
							// Keep the entire link if it doesn't match the filter
							result += text.slice(i, k);
							i = k;
							continue;
						}
					}

					// This is a valid markdown link that should be removed
					// For images, add nothing; for links, add the link text if keepText is true
					if (isImage) {
						// Check embed type filter - keep the embed if its type is disabled
						if (embedTypes && !embedTypes[getEmbedCategory(url)]) {
							result += text.slice(i, k);
							i = k;
							continue;
						}
						result += '';
					} else {
						result += keepText ? linkText : '';
					}
					i = k;
					continue;
				}
			}
		}

		// If we get here, just copy the current character
		result += text[i];
		i++;
	}

	return result;
}

export function removeWikilinks(text: string, keepAlias: boolean, whitelist: string[] = [], blacklistMode: boolean = false, blacklist: string[] = [], embedTypes?: EmbedTypeOptions): string {
	let result = text;

	// Match [[ content ]]
	const wikilinkRegex = /(!?)\[\[(.*?)\]\]/g;

	result = result.replace(wikilinkRegex, (match: string, isImage: string, content: string) => {
		// If it's an image embed (![[...]]), replace with empty string
		if (isImage) {
			// Check embed type filter - keep the embed if its type is disabled
			if (embedTypes && !embedTypes[getEmbedCategory(content)]) {
				return match;
			}
			return '';
		}

		// Check blacklist/whitelist logic for wikilinks
		if (blacklistMode) {
			// In blacklist mode, only remove if wikilink matches blacklist
			const isBlacklisted = blacklist.some(blacklistItem => {
				// For exact matching, compare the full content or just the path part (before |)
				const pathPart = content.indexOf('|') !== -1 ? content.substring(0, content.indexOf('|')) : content;
				return pathPart.toLowerCase() === blacklistItem.toLowerCase();
			});

			if (!isBlacklisted) {
				// Keep the entire wikilink if not blacklisted
				return match;
			}
		} else {
			// Whitelist mode - check if the wikilink content is in whitelist (exact match)
			const isWhitelisted = whitelist.some(whitelistItem => {
				// For exact matching, compare the full content or just the path part (before |)
				const pathPart = content.indexOf('|') !== -1 ? content.substring(0, content.indexOf('|')) : content;
				return pathPart.toLowerCase() === whitelistItem.toLowerCase();
			});

			if (isWhitelisted) {
				// Keep the entire wikilink if whitelisted
				return match;
			}
		}

		// For regular wikilinks, check if there's a pipe (alias)
		const pipeIndex = content.indexOf('|');
		if (pipeIndex !== -1) {
			// keepAliase true/false logic
			return keepAlias ? content.substring(pipeIndex + 1) : content.substring(0, pipeIndex);
		}

		// No alias, use the link path
		return content;
	});

	return result;
}
