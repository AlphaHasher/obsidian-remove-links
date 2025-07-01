export function removeHyperlinks(text:string): string {
	let result = text;
	let match;
	const regex = /\[((?:[^\]\\]|\\.|\](?!\())*?)\]\(/g;

	while ((match = regex.exec(text)) !== null) {
		const linkText = match[1];
		const startPos = match.index;
		const urlStartPos = match.index + match[0].length;

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
			const fullMatch = text.substring(startPos, urlEndPos + 1);
			result = result.replace(fullMatch, linkText);
		}
	}

	return result;
}
