function removeHyperlinks(text) {
	return text.replace(/\[((?:[^\]\\]|\\.|\](?!\())*?)\]\(([^)]+)\)/g, '$1');
}

describe('removeHyperlinks', () => {
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

  test('handle text with escaped brackets', () => {
    const inputText = "[text with \\[escaped\\] brackets](https://example.com)";
    const expectedOutput = "text with \\[escaped\\] brackets";
    const result = removeHyperlinks(inputText);
    expect(result).toBe(expectedOutput);
  });
});
