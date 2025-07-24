export function removeHyperlinks(text:string): string {
	let result = text;
	let match;
	const regex = /!?\[((?:[^\]\\]|\\.|\](?!\())*?)\]\(/g;

	while ((match = regex.exec(text)) !== null) {
		const linkText = match[1];
		const startPos = match.index;
		const urlStartPos = match.index + match[0].length;
		const isImage = match[0].startsWith('!');

		// Find the matching closing parenthesis
		let parenCount = 1;
		let urlEndPos = urlStartPos;

		while (urlEndPos < text.length && parenCount > 0) {
			if (text[urlEndPos] === '(') {
				parenCount++;
			} else if (text[urlEndPos] === ')') {
				parenCount--;
			}
			if (parenCount > 0) {
				urlEndPos++;
			}
		}

		if (parenCount === 0) {
			// For images (![]() pattern), replace with empty string
			// For regular links ([]() pattern), replace with link text
			const fullMatch = text.substring(startPos, urlEndPos + 1);
			const replacement = isImage ? '' : linkText;
			result = result.replace(fullMatch, replacement);
		}
	}

	return result;
}
