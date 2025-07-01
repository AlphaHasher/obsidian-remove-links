import { describe, expect, test } from '@jest/globals';

function removeHyperlinks(text:string): string {
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

describe('Remove Hyper Links Tests', () => {
  test('remove hyperlinks from text', () => {
    const inputText = "[hypertext](https)";
    const expectedOutput = "hypertext";
    const result = removeHyperlinks(inputText);
    expect(result).toBe(expectedOutput);
  });

  test('remove multiple hyperlinks', () => {
    const inputText = "Check out [Google](https://google.com) and [GitHub](https://github.com)";
    const expectedOutput = "Check out Google and GitHub";
    const result = removeHyperlinks(inputText);
    expect(result).toBe(expectedOutput);
  });

  test('handle text without hyperlinks', () => {
    const inputText = "This is just plain text";
    const result = removeHyperlinks(inputText);
    expect(result).toBe(inputText);
  });

  test('handle complex hyperlinks with nested brackets', () => {
    const inputText = "[text with [brackets]](https://example.com)";
    const expectedOutput = "text with [brackets]";
    const result = removeHyperlinks(inputText);
    expect(result).toBe(expectedOutput);
  });

  test('handle empty text', () => {
    const inputText = "";
    const result = removeHyperlinks(inputText);
    expect(result).toBe("");
  });

  test('handle text with escaped brackets 1', () => {
    const inputText = "[text with \[escaped\] brackets](https://example.com)";
    const expectedOutput = "text with \[escaped\] brackets";
    const result = removeHyperlinks(inputText);
    expect(result).toBe(expectedOutput);
  });

  test('handle text with escaped brackets 2', () => {
    const inputText = "[text with \\[escaped\\] brackets](https://example.com)";
    const expectedOutput = "text with \\[escaped\\] brackets";
    const result = removeHyperlinks(inputText);
    expect(result).toBe(expectedOutput);
  });

  test('handling of () in URL', () => {
    const inputText = "[OK go song](https://en.m.wikipedia.org/wiki/I_Won%27t_Let_You_Down_(OK_Go_song))";
    const expectedOutput = "OK go song";
    const result = removeHyperlinks(inputText);
        expect(result).toBe(expectedOutput);
    });

});
