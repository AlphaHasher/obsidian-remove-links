import { describe, expect, test } from '@jest/globals';

import { removeHyperlinks, removeWikilinks } from './removeLinks';

describe('Remove Hyper Links Tests', () => {
  test('remove hyperlinks from text', () => {
    const inputText = "[hypertext](https)";
    const expectedOutput = "hypertext";
    const result = removeHyperlinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

  test('remove hyperlinks from text - keepText false', () => {
    const inputText = "[hypertext](https)";
    const expectedOutput = "";
    const result = removeHyperlinks(inputText, false);
    expect(result).toBe(expectedOutput);
  });

  test('remove multiple hyperlinks', () => {
    const inputText = "Check out [Google](https://google.com) and [GitHub](https://github.com)";
    const expectedOutput = "Check out Google and GitHub";
    const result = removeHyperlinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

  test('remove multiple hyperlinks - keepText false', () => {
    const inputText = "Check out [Google](https://google.com) and [GitHub](https://github.com)";
    const expectedOutput = "Check out  and ";
    const result = removeHyperlinks(inputText, false);
    expect(result).toBe(expectedOutput);
  });

  test('handle text without hyperlinks', () => {
    const inputText = "This is just plain text";
    const result = removeHyperlinks(inputText, true);
    expect(result).toBe(inputText);
  });

  test('handle complex hyperlinks with nested brackets', () => {
    const inputText = "[text with [brackets]](https://example.com)";
    const expectedOutput = "text with [brackets]";
    const result = removeHyperlinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

  test('handle empty text', () => {
    const inputText = "";
    const result = removeHyperlinks(inputText, true);
    expect(result).toBe("");
  });

  test('handle text with escaped brackets 1', () => {
    const inputText = "[text with \[escaped\] brackets](https://example.com)";
    const expectedOutput = "text with \[escaped\] brackets";
    const result = removeHyperlinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

  test('handle text with escaped brackets 2', () => {
    const inputText = "[text with \\[escaped\\] brackets](https://example.com)";
    const expectedOutput = "text with \\[escaped\\] brackets";
    const result = removeHyperlinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

  test('handling of () in URL', () => {
    const inputText = "[OK go song](https://en.m.wikipedia.org/wiki/I_Won%27t_Let_You_Down_(OK_Go_song))";
    const expectedOutput = "OK go song";
    const result = removeHyperlinks(inputText, true);
        expect(result).toBe(expectedOutput);
    });

  test('handling of ![]() pattern', () => {
    const inputText = "![](image.png)";
    const expectedOutput = "";
    const result = removeHyperlinks(inputText, true);
        expect(result).toBe(expectedOutput);
    });

  test('handling of wikilinks', () => {
    const inputText = "[[example.md]]\n[hypertext](https)";
    const expectedOutput = "[[example.md]]\nhypertext"; // Should NOT be processed by removeHyperlinks
    const result = removeHyperlinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

  test('handling of wikilinks with alias', () => {
    const inputText = "[[example.md|alias]]";
    const expectedOutput = "[[example.md|alias]]"; // Should NOT be processed by removeHyperlinks
    const result = removeHyperlinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

  test('handling of image embeds', () => {
    const inputText = "![[example.png]]";
    const expectedOutput = "![[example.png]]"; // Should NOT be processed by removeHyperlinks
    const result = removeHyperlinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

  test('handling of sized image embeds', () => {
    const inputText = "![[example.png|300]]";
    const expectedOutput = "![[example.png|300]]"; // Should NOT be processed by removeHyperlinks
    const result = removeHyperlinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

  test('handling of wikilinks with escaped brackets', () => {
    const inputText = "[[text with \\[escaped\\] brackets]]";
    const expectedOutput = "[[text with \\[escaped\\] brackets]]"; // Should NOT be processed by removeHyperlinks
    const result = removeHyperlinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

  test('handling of wikilinks with escaped brackets and alias', () => {
    const inputText = "[[text with \\[escaped\\] brackets|alias]]";
    const expectedOutput = "[[text with \\[escaped\\] brackets|alias]]"; // Should NOT be processed by removeHyperlinks
    const result = removeHyperlinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

  test('mixed wikilinks and hyperlinks in same line', () => {
    const inputText = "See [[wiki page]] and [external link](https://example.com) for more info";
    const expectedOutput = "See [[wiki page]] and external link for more info";
    const result = removeHyperlinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

  test('hyperlink immediately after wikilink', () => {
    const inputText = "[[wiki]]([hyperlink](https://example.com))";
    const expectedOutput = "[[wiki]](hyperlink)";
    const result = removeHyperlinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

  test('wikilink immediately after hyperlink', () => {
    const inputText = "[link](https://example.com)[[wiki]]";
    const expectedOutput = "link[[wiki]]";
    const result = removeHyperlinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

  test('nested wikilinks and hyperlinks', () => {
    const inputText = "Check [this [nested] link](https://example.com) and [[wiki|alias]] page";
    const expectedOutput = "Check this [nested] link and [[wiki|alias]] page";
    const result = removeHyperlinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

  test('image embed followed by hyperlink', () => {
    const inputText = "![[image.png|300]] See [more info](https://example.com)";
    const expectedOutput = "![[image.png|300]] See more info";
    const result = removeHyperlinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

  test('hyperlink followed by image embed', () => {
    const inputText = "[Click here](https://example.com) ![[screenshot.png]]";
    const expectedOutput = "Click here ![[screenshot.png]]";
    const result = removeHyperlinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

  test('multiple lines with mixed link types', () => {
    const inputText = "Line 1: [[wiki link]]\nLine 2: [hyperlink](https://example.com)\nLine 3: ![[image.png]]";
    const expectedOutput = "Line 1: [[wiki link]]\nLine 2: hyperlink\nLine 3: ![[image.png]]";
    const result = removeHyperlinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

  test('wikilink with brackets in URL-like format', () => {
    const inputText = "[[page.md]] and [real link](https://example.com/path[with]brackets)";
    const expectedOutput = "[[page.md]] and real link";
    const result = removeHyperlinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

  test('markdown image next to wikilink', () => {
    const inputText = "![alt text](image.jpg)[[wiki page]]";
    const expectedOutput = "[[wiki page]]";
    const result = removeHyperlinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

  test('complex mixed content with all link types', () => {
    const inputText = "Start ![[embed.png]] then [[wiki|alias]], followed by [hyperlink](https://example.com) and ![image](pic.jpg) end";
    const expectedOutput = "Start ![[embed.png]] then [[wiki|alias]], followed by hyperlink and  end";
    const result = removeHyperlinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

  test('wikilink containing pipe character near hyperlink', () => {
    const inputText = "[[file|display name]] and [link](https://site.com/page?param=value|other)";
    const expectedOutput = "[[file|display name]] and link";
    const result = removeHyperlinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

  test('empty wikilinks and hyperlinks', () => {
    const inputText = "[[]] [empty](https://example.com) ![[]]";
    const expectedOutput = "[[]] empty ![[]]";
    const result = removeHyperlinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

});

describe('Remove Wiki Links Tests', () => {
  test('remove simple wikilinks', () => {
    const inputText = "[[example.md]]";
    const expectedOutput = "example.md";
    const result = removeWikilinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

  test('remove wikilinks with alias - keep alias', () => {
    const inputText = "[[example.md|alias]]";
    const expectedOutput = "alias";
    const result = removeWikilinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

  test('remove wikilinks with alias - keep link path', () => {
    const inputText = "[[example.md|alias]]";
    const expectedOutput = "example.md";
    const result = removeWikilinks(inputText, false);
    expect(result).toBe(expectedOutput);
  });

  test('remove image embeds', () => {
    const inputText = "![[example.png]]";
    const expectedOutput = "";
    const result = removeWikilinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

  test('remove sized image embeds', () => {
    const inputText = "![[example.png|300]]";
    const expectedOutput = "";
    const result = removeWikilinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

  test('remove wikilinks with escaped brackets', () => {
    const inputText = "[[text with \\[escaped\\] brackets]]";
    const expectedOutput = "text with \\[escaped\\] brackets";
    const result = removeWikilinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

  test('remove wikilinks with escaped brackets and alias - keep alias', () => {
    const inputText = "[[text with \\[escaped\\] brackets|alias]]";
    const expectedOutput = "alias";
    const result = removeWikilinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

  test('remove wikilinks with escaped brackets and alias - keep link path', () => {
    const inputText = "[[text with \\[escaped\\] brackets|alias]]";
    const expectedOutput = "text with \\[escaped\\] brackets";
    const result = removeWikilinks(inputText, false);
    expect(result).toBe(expectedOutput);
  });

  test('handle text without wikilinks', () => {
    const inputText = "This is just plain text";
    const result = removeWikilinks(inputText, true);
    expect(result).toBe(inputText);
  });

  test('handle hyperlinks (should not be processed)', () => {
    const inputText = "[Google](https://google.com)";
    const result = removeWikilinks(inputText, true);
    expect(result).toBe(inputText);
  });

  test('handle multiple wikilinks - keep aliases', () => {
    const inputText = "Check out [[page1]] and [[page2|alias]]";
    const expectedOutput = "Check out page1 and alias";
    const result = removeWikilinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

  test('handle multiple wikilinks - keep link paths', () => {
    const inputText = "Check out [[page1]] and [[page2|alias]]";
    const expectedOutput = "Check out page1 and page2";
    const result = removeWikilinks(inputText, false);
    expect(result).toBe(expectedOutput);
  });

  test('mixed hyperlinks and wikilinks - ignore hyperlinks', () => {
    const inputText = "See [external link](https://example.com) and [[wiki page]] for info";
    const expectedOutput = "See [external link](https://example.com) and wiki page for info";
    const result = removeWikilinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

  test('wikilink next to hyperlink - only process wikilink', () => {
    const inputText = "[[wiki page]][hyperlink](https://example.com)";
    const expectedOutput = "wiki page[hyperlink](https://example.com)";
    const result = removeWikilinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

  test('image embeds mixed with markdown images', () => {
    const inputText = "![[obsidian-image.png]] and ![markdown image](image.jpg)";
    const expectedOutput = " and ![markdown image](image.jpg)";
    const result = removeWikilinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

  test('multiple lines with mixed content - only process wikilinks', () => {
    const inputText = "Line 1: [hyperlink](https://example.com)\nLine 2: [[wiki link]]\nLine 3: ![image](pic.jpg)";
    const expectedOutput = "Line 1: [hyperlink](https://example.com)\nLine 2: wiki link\nLine 3: ![image](pic.jpg)";
    const result = removeWikilinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

  test('wikilinks with complex aliases near hyperlinks - keep aliases', () => {
    const inputText = "[[complex/path/file.md|Simple Name]] [link](https://example.com)";
    const expectedOutput = "Simple Name [link](https://example.com)";
    const result = removeWikilinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

  test('wikilinks with complex aliases near hyperlinks - keep link paths', () => {
    const inputText = "[[complex/path/file.md|Simple Name]] [link](https://example.com)";
    const expectedOutput = "complex/path/file.md [link](https://example.com)";
    const result = removeWikilinks(inputText, false);
    expect(result).toBe(expectedOutput);
  });

  test('nested brackets in wikilinks with nearby hyperlinks', () => {
    const inputText = "[[page with [brackets] in name]] and [normal link](https://site.com)";
    const expectedOutput = "page with [brackets] in name and [normal link](https://site.com)";
    const result = removeWikilinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

  test('empty and malformed patterns - keep aliases', () => {
    const inputText = "[[]] [link](url) ![[]] [[valid|alias]]";
    const expectedOutput = " [link](url)  alias";
    const result = removeWikilinks(inputText, true);
    expect(result).toBe(expectedOutput);
  });

  test('empty and malformed patterns - keep link paths', () => {
    const inputText = "[[]] [link](url) ![[]] [[valid|alias]]";
    const expectedOutput = " [link](url)  valid";
    const result = removeWikilinks(inputText, false);
    expect(result).toBe(expectedOutput);
  });

});
