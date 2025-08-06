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

export function removeHyperlinks(text: string, keepText: boolean, whitelist: string[] = [], linkType: 'both' | 'internal' | 'external' = 'both'): string {
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
					// Check if URL is in whitelist
					const isWhitelisted = whitelist.some(whitelistItem => 
						url.toLowerCase().includes(whitelistItem.toLowerCase())
					);
					
					if (isWhitelisted) {
						// Keep the entire link if whitelisted
						result += text.slice(i, k);
						i = k;
						continue;
					}
					
					// Check link type filter
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
					
					// This is a valid markdown link that should be removed
					// For images, add nothing; for links, add the link text if keepText is true
					if (isImage) {
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

export function removeWikilinks(text: string, keepAlias: boolean, whitelist: string[] = []): string {
	let result = text;
	
	// Match [[ content ]]
	const wikilinkRegex = /(!?)\[\[(.*?)\]\]/g;
	
	result = result.replace(wikilinkRegex, (match, isImage, content) => {
		// If it's an image embed (![[...]]), replace with empty string
		if (isImage) {
			return '';
		}
		
		// Check if the wikilink content is in whitelist (exact match)
		const isWhitelisted = whitelist.some(whitelistItem => {
			// For exact matching, compare the full content or just the path part (before |)
			const pathPart = content.indexOf('|') !== -1 ? content.substring(0, content.indexOf('|')) : content;
			return pathPart.toLowerCase() === whitelistItem.toLowerCase();
		});
		
		if (isWhitelisted) {
			// Keep the entire wikilink if whitelisted
			return match;
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
