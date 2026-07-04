import { describe, expect, test } from '@jest/globals';

import { EmbedTypeOptions, getEmbedCategory, removeCitations, removeHyperlinks, removeWikilinks, removeWikipediaCitations } from './removeLinks';

describe('Remove Wikipedia Citations Tests', () => {
  test('remove single footnote', () => {
    expect(removeWikipediaCitations("Text.[[2]](http://a)")).toBe("Text.");
  });

  test('remove multiple footnotes', () => {
    expect(removeWikipediaCitations("Fact[[1]](http://a) and more[[23]](http://b).")).toBe("Fact and more.");
  });

  test('leave plain numeric brackets untouched', () => {
    expect(removeWikipediaCitations("text[2]")).toBe("text[2]");
  });

  test('leave wikilinks untouched', () => {
    expect(removeWikipediaCitations("[[2]]")).toBe("[[2]]");
  });
});

describe('Remove Citation Links Tests', () => {
  test('remove single citation', () => {
    expect(removeCitations("[[1](http://a)]")).toBe("");
  });

  test('remove multiple citations in one bracket', () => {
    expect(removeCitations("text [[1](http://a), [2](http://b)] more")).toBe("text  more");
  });

  test('remove citation with 3+ links', () => {
    expect(removeCitations("[[1](http://a), [2](http://b), [3](http://c)]")).toBe("");
  });

  test('remove citation inline after text', () => {
    expect(removeCitations("Fact[[1](http://a)].")).toBe("Fact.");
  });

  test('leave plain wikilinks untouched', () => {
    expect(removeCitations("[[some note]]")).toBe("[[some note]]");
  });

  test('leave normal markdown links untouched', () => {
    expect(removeCitations("[label](http://a)")).toBe("[label](http://a)");
  });
});

describe('Remove Hyper Links Tests', () => {
  test('remove hyperlinks from text', () => {
    const inputText = "[hypertext](https)";
    const expectedOutput = "hypertext";
    const result = removeHyperlinks(inputText, true, [], 'both');
    expect(result).toBe(expectedOutput);
  });

  test('remove hyperlinks from text - keepText false', () => {
    const inputText = "[hypertext](https)";
    const expectedOutput = "";
    const result = removeHyperlinks(inputText, false, [], 'both');
    expect(result).toBe(expectedOutput);
  });

  test('remove multiple hyperlinks', () => {
    const inputText = "Check out [Google](https://google.com) and [GitHub](https://github.com)";
    const expectedOutput = "Check out Google and GitHub";
    const result = removeHyperlinks(inputText, true, [], 'both');
    expect(result).toBe(expectedOutput);
  });

  test('remove multiple hyperlinks - keepText false', () => {
    const inputText = "Check out [Google](https://google.com) and [GitHub](https://github.com)";
    const expectedOutput = "Check out  and ";
    const result = removeHyperlinks(inputText, false, [], 'both');
    expect(result).toBe(expectedOutput);
  });

  test('handle text without hyperlinks', () => {
    const inputText = "This is just plain text";
    const result = removeHyperlinks(inputText, true, [], 'both');
    expect(result).toBe(inputText);
  });

  test('handle complex hyperlinks with nested brackets', () => {
    const inputText = "[text with [brackets]](https://example.com)";
    const expectedOutput = "text with [brackets]";
    const result = removeHyperlinks(inputText, true, [], 'both');
    expect(result).toBe(expectedOutput);
  });

  test('handle empty text', () => {
    const inputText = "";
    const result = removeHyperlinks(inputText, true, [], 'both');
    expect(result).toBe("");
  });

  test('handle text with escaped brackets 1', () => {
    const inputText = "[text with \[escaped\] brackets](https://example.com)";
    const expectedOutput = "text with \[escaped\] brackets";
    const result = removeHyperlinks(inputText, true, [], 'both');
    expect(result).toBe(expectedOutput);
  });

  test('handle text with escaped brackets 2', () => {
    const inputText = "[text with \\[escaped\\] brackets](https://example.com)";
    const expectedOutput = "text with \\[escaped\\] brackets";
    const result = removeHyperlinks(inputText, true, [], 'both');
    expect(result).toBe(expectedOutput);
  });

  test('handling of () in URL', () => {
    const inputText = "[OK go song](https://en.m.wikipedia.org/wiki/I_Won%27t_Let_You_Down_(OK_Go_song))";
    const expectedOutput = "OK go song";
    const result = removeHyperlinks(inputText, true, [], 'both');
        expect(result).toBe(expectedOutput);
    });

  test('handling of ![]() pattern', () => {
    const inputText = "![](image.png)";
    const expectedOutput = "";
    const result = removeHyperlinks(inputText, true, [], 'both');
        expect(result).toBe(expectedOutput);
    });

  test('handling of wikilinks', () => {
    const inputText = "[[example.md]]\n[hypertext](https)";
    const expectedOutput = "[[example.md]]\nhypertext"; // Should NOT be processed by removeHyperlinks
    const result = removeHyperlinks(inputText, true, [], 'both');
    expect(result).toBe(expectedOutput);
  });

  test('handling of wikilinks with alias', () => {
    const inputText = "[[example.md|alias]]";
    const expectedOutput = "[[example.md|alias]]"; // Should NOT be processed by removeHyperlinks
    const result = removeHyperlinks(inputText, true, [], 'both');
    expect(result).toBe(expectedOutput);
  });

  test('handling of image embeds', () => {
    const inputText = "![[example.png]]";
    const expectedOutput = "![[example.png]]"; // Should NOT be processed by removeHyperlinks
    const result = removeHyperlinks(inputText, true, [], 'both');
    expect(result).toBe(expectedOutput);
  });

  test('handling of sized image embeds', () => {
    const inputText = "![[example.png|300]]";
    const expectedOutput = "![[example.png|300]]"; // Should NOT be processed by removeHyperlinks
    const result = removeHyperlinks(inputText, true, [], 'both');
    expect(result).toBe(expectedOutput);
  });

  test('handling of wikilinks with escaped brackets', () => {
    const inputText = "[[text with \\[escaped\\] brackets]]";
    const expectedOutput = "[[text with \\[escaped\\] brackets]]"; // Should NOT be processed by removeHyperlinks
    const result = removeHyperlinks(inputText, true, [], 'both');
    expect(result).toBe(expectedOutput);
  });

  test('handling of wikilinks with escaped brackets and alias', () => {
    const inputText = "[[text with \\[escaped\\] brackets|alias]]";
    const expectedOutput = "[[text with \\[escaped\\] brackets|alias]]"; // Should NOT be processed by removeHyperlinks
    const result = removeHyperlinks(inputText, true, [], 'both');
    expect(result).toBe(expectedOutput);
  });

  test('mixed wikilinks and hyperlinks in same line', () => {
    const inputText = "See [[wiki page]] and [external link](https://example.com) for more info";
    const expectedOutput = "See [[wiki page]] and external link for more info";
    const result = removeHyperlinks(inputText, true, [], 'both');
    expect(result).toBe(expectedOutput);
  });

  test('hyperlink immediately after wikilink', () => {
    const inputText = "[[wiki]]([hyperlink](https://example.com))";
    const expectedOutput = "[[wiki]](hyperlink)";
    const result = removeHyperlinks(inputText, true, [], 'both');
    expect(result).toBe(expectedOutput);
  });

  test('wikilink immediately after hyperlink', () => {
    const inputText = "[link](https://example.com)[[wiki]]";
    const expectedOutput = "link[[wiki]]";
    const result = removeHyperlinks(inputText, true, [], 'both');
    expect(result).toBe(expectedOutput);
  });

  test('nested wikilinks and hyperlinks', () => {
    const inputText = "Check [this [nested] link](https://example.com) and [[wiki|alias]] page";
    const expectedOutput = "Check this [nested] link and [[wiki|alias]] page";
    const result = removeHyperlinks(inputText, true, [], 'both');
    expect(result).toBe(expectedOutput);
  });

  test('image embed followed by hyperlink', () => {
    const inputText = "![[image.png|300]] See [more info](https://example.com)";
    const expectedOutput = "![[image.png|300]] See more info";
    const result = removeHyperlinks(inputText, true, [], 'both');
    expect(result).toBe(expectedOutput);
  });

  test('hyperlink followed by image embed', () => {
    const inputText = "[Click here](https://example.com) ![[screenshot.png]]";
    const expectedOutput = "Click here ![[screenshot.png]]";
    const result = removeHyperlinks(inputText, true, [], 'both');
    expect(result).toBe(expectedOutput);
  });

  test('multiple lines with mixed link types', () => {
    const inputText = "Line 1: [[wiki link]]\nLine 2: [hyperlink](https://example.com)\nLine 3: ![[image.png]]";
    const expectedOutput = "Line 1: [[wiki link]]\nLine 2: hyperlink\nLine 3: ![[image.png]]";
    const result = removeHyperlinks(inputText, true, [], 'both');
    expect(result).toBe(expectedOutput);
  });

  test('wikilink with brackets in URL-like format', () => {
    const inputText = "[[page.md]] and [real link](https://example.com/path[with]brackets)";
    const expectedOutput = "[[page.md]] and real link";
    const result = removeHyperlinks(inputText, true, [], 'both');
    expect(result).toBe(expectedOutput);
  });

  test('markdown image next to wikilink', () => {
    const inputText = "![alt text](image.jpg)[[wiki page]]";
    const expectedOutput = "[[wiki page]]";
    const result = removeHyperlinks(inputText, true, [], 'both');
    expect(result).toBe(expectedOutput);
  });

  test('complex mixed content with all link types', () => {
    const inputText = "Start ![[embed.png]] then [[wiki|alias]], followed by [hyperlink](https://example.com) and ![image](pic.jpg) end";
    const expectedOutput = "Start ![[embed.png]] then [[wiki|alias]], followed by hyperlink and  end";
    const result = removeHyperlinks(inputText, true, [], 'both');
    expect(result).toBe(expectedOutput);
  });

  test('wikilink containing pipe character near hyperlink', () => {
    const inputText = "[[file|display name]] and [link](https://site.com/page?param=value|other)";
    const expectedOutput = "[[file|display name]] and link";
    const result = removeHyperlinks(inputText, true, [], 'both');
    expect(result).toBe(expectedOutput);
  });

  test('empty wikilinks and hyperlinks', () => {
    const inputText = "[[]] [empty](https://example.com) ![[]]";
    const expectedOutput = "[[]] empty ![[]]";
    const result = removeHyperlinks(inputText, true, [], 'both');
    expect(result).toBe(expectedOutput);
  });

  // Whitelist functionality tests
  test('whitelist single domain - should preserve whitelisted link', () => {
    const inputText = "Check out [Google](https://google.com) and [GitHub](https://github.com)";
    const expectedOutput = "Check out [Google](https://google.com) and GitHub";
    const result = removeHyperlinks(inputText, true, ['google.com'], 'both');
    expect(result).toBe(expectedOutput);
  });

  test('whitelist with wikilinks - should not affect wikilink processing', () => {
    const inputText = "[[wiki link]] and [hyperlink](https://wikipedia.org) and [other](https://example.com)";
    const expectedOutput = "[[wiki link]] and [hyperlink](https://wikipedia.org) and other";
    const result = removeHyperlinks(inputText, true, ['wikipedia.org'], 'both');
    expect(result).toBe(expectedOutput);
  });

  test('empty whitelist - should behave like original function', () => {
    const inputText = "[Google](https://google.com) and [GitHub](https://github.com)";
    const expectedOutput = "Google and GitHub";
    const result = removeHyperlinks(inputText, true, [], 'both');
    expect(result).toBe(expectedOutput);
  });

  // Link type filtering tests
  test('internal links only - should remove only internal links', () => {
    const inputText = "[Internal](page.md) and [External](https://google.com) and [Another](folder/file)";
    const expectedOutput = "Internal and [External](https://google.com) and Another";
    const result = removeHyperlinks(inputText, true, [], 'internal');
    expect(result).toBe(expectedOutput);
  });

  test('external links only - should remove only external links', () => {
    const inputText = "[Internal](page.md) and [External](https://google.com) and [Another](folder/file)";
    const expectedOutput = "[Internal](page.md) and External and [Another](folder/file)";
    const result = removeHyperlinks(inputText, true, [], 'external');
    expect(result).toBe(expectedOutput);
  });

  test('both links - should remove all links', () => {
    const inputText = "[Internal](page.md) and [External](https://google.com) and [Another](folder/file)";
    const expectedOutput = "Internal and External and Another";
    const result = removeHyperlinks(inputText, true, [], 'both');
    expect(result).toBe(expectedOutput);
  });

  test('internal link detection - relative paths', () => {
    const inputText = "[Relative](./folder/file.md) and [Hash](#heading) and [External](https://site.com)";
    const expectedOutput = "Relative and Hash and [External](https://site.com)";
    const result = removeHyperlinks(inputText, true, [], 'internal');
    expect(result).toBe(expectedOutput);
  });

  test('external link detection - various protocols', () => {
    const inputText = "[HTTP](http://site.com) and [HTTPS](https://site.com) and [FTP](ftp://server.com) and [Internal](page.md)";
    const expectedOutput = "HTTP and HTTPS and FTP and [Internal](page.md)";
    const result = removeHyperlinks(inputText, true, [], 'external');
    expect(result).toBe(expectedOutput);
  });

  test('link type filter with whitelist - whitelist takes precedence', () => {
    const inputText = "[Wikipedia](https://wikipedia.org) and [Google](https://google.com) and [Internal](page.md)";
    const expectedOutput = "[Wikipedia](https://wikipedia.org) and Google and [Internal](page.md)";
    const result = removeHyperlinks(inputText, true, ['wikipedia.org'], 'external');
    expect(result).toBe(expectedOutput);
  });

});

describe('Remove Wiki Links Tests', () => {
  test('remove simple wikilinks', () => {
    const inputText = "[[example.md]]";
    const expectedOutput = "example.md";
    const result = removeWikilinks(inputText, true, []);
    expect(result).toBe(expectedOutput);
  });

  test('remove wikilinks with alias - keep alias', () => {
    const inputText = "[[example.md|alias]]";
    const expectedOutput = "alias";
    const result = removeWikilinks(inputText, true, []);
    expect(result).toBe(expectedOutput);
  });

  test('remove wikilinks with alias - keep link path', () => {
    const inputText = "[[example.md|alias]]";
    const expectedOutput = "example.md";
    const result = removeWikilinks(inputText, false, []);
    expect(result).toBe(expectedOutput);
  });

  test('remove image embeds', () => {
    const inputText = "![[example.png]]";
    const expectedOutput = "";
    const result = removeWikilinks(inputText, true, []);
    expect(result).toBe(expectedOutput);
  });

  test('remove sized image embeds', () => {
    const inputText = "![[example.png|300]]";
    const expectedOutput = "";
    const result = removeWikilinks(inputText, true, []);
    expect(result).toBe(expectedOutput);
  });

  test('remove wikilinks with escaped brackets', () => {
    const inputText = "[[text with \\[escaped\\] brackets]]";
    const expectedOutput = "text with \\[escaped\\] brackets";
    const result = removeWikilinks(inputText, true, []);
    expect(result).toBe(expectedOutput);
  });

  test('remove wikilinks with escaped brackets and alias - keep alias', () => {
    const inputText = "[[text with \\[escaped\\] brackets|alias]]";
    const expectedOutput = "alias";
    const result = removeWikilinks(inputText, true, []);
    expect(result).toBe(expectedOutput);
  });

  test('remove wikilinks with escaped brackets and alias - keep link path', () => {
    const inputText = "[[text with \\[escaped\\] brackets|alias]]";
    const expectedOutput = "text with \\[escaped\\] brackets";
    const result = removeWikilinks(inputText, false, []);
    expect(result).toBe(expectedOutput);
  });

  test('handle text without wikilinks', () => {
    const inputText = "This is just plain text";
    const result = removeWikilinks(inputText, true, []);
    expect(result).toBe(inputText);
  });

  test('handle hyperlinks (should not be processed)', () => {
    const inputText = "[Google](https://google.com)";
    const result = removeWikilinks(inputText, true, []);
    expect(result).toBe(inputText);
  });

  test('handle multiple wikilinks - keep aliases', () => {
    const inputText = "Check out [[page1]] and [[page2|alias]]";
    const expectedOutput = "Check out page1 and alias";
    const result = removeWikilinks(inputText, true, []);
    expect(result).toBe(expectedOutput);
  });

  test('handle multiple wikilinks - keep link paths', () => {
    const inputText = "Check out [[page1]] and [[page2|alias]]";
    const expectedOutput = "Check out page1 and page2";
    const result = removeWikilinks(inputText, false, []);
    expect(result).toBe(expectedOutput);
  });

  test('mixed hyperlinks and wikilinks - ignore hyperlinks', () => {
    const inputText = "See [external link](https://example.com) and [[wiki page]] for info";
    const expectedOutput = "See [external link](https://example.com) and wiki page for info";
    const result = removeWikilinks(inputText, true, []);
    expect(result).toBe(expectedOutput);
  });

  test('wikilink next to hyperlink - only process wikilink', () => {
    const inputText = "[[wiki page]][hyperlink](https://example.com)";
    const expectedOutput = "wiki page[hyperlink](https://example.com)";
    const result = removeWikilinks(inputText, true, []);
    expect(result).toBe(expectedOutput);
  });

  test('image embeds mixed with markdown images', () => {
    const inputText = "![[obsidian-image.png]] and ![markdown image](image.jpg)";
    const expectedOutput = " and ![markdown image](image.jpg)";
    const result = removeWikilinks(inputText, true, []);
    expect(result).toBe(expectedOutput);
  });

  test('multiple lines with mixed content - only process wikilinks', () => {
    const inputText = "Line 1: [hyperlink](https://example.com)\nLine 2: [[wiki link]]\nLine 3: ![image](pic.jpg)";
    const expectedOutput = "Line 1: [hyperlink](https://example.com)\nLine 2: wiki link\nLine 3: ![image](pic.jpg)";
    const result = removeWikilinks(inputText, true, []);
    expect(result).toBe(expectedOutput);
  });

  test('wikilinks with complex aliases near hyperlinks - keep aliases', () => {
    const inputText = "[[complex/path/file.md|Simple Name]] [link](https://example.com)";
    const expectedOutput = "Simple Name [link](https://example.com)";
    const result = removeWikilinks(inputText, true, []);
    expect(result).toBe(expectedOutput);
  });

  test('wikilinks with complex aliases near hyperlinks - keep link paths', () => {
    const inputText = "[[complex/path/file.md|Simple Name]] [link](https://example.com)";
    const expectedOutput = "complex/path/file.md [link](https://example.com)";
    const result = removeWikilinks(inputText, false, []);
    expect(result).toBe(expectedOutput);
  });

  test('nested brackets in wikilinks with nearby hyperlinks', () => {
    const inputText = "[[page with [brackets] in name]] and [normal link](https://site.com)";
    const expectedOutput = "page with [brackets] in name and [normal link](https://site.com)";
    const result = removeWikilinks(inputText, true, []);
    expect(result).toBe(expectedOutput);
  });

  test('empty and malformed patterns - keep aliases', () => {
    const inputText = "[[]] [link](url) ![[]] [[valid|alias]]";
    const expectedOutput = " [link](url)  alias";
    const result = removeWikilinks(inputText, true, []);
    expect(result).toBe(expectedOutput);
  });

  test('empty and malformed patterns - keep link paths', () => {
    const inputText = "[[]] [link](url) ![[]] [[valid|alias]]";
    const expectedOutput = " [link](url)  valid";
    const result = removeWikilinks(inputText, false, []);
    expect(result).toBe(expectedOutput);
  });

  // Wikilink whitelist tests
  test('wikilink whitelist - should preserve whitelisted wikilinks', () => {
    const inputText = "[[important-note]] and [[regular-note]] and [[important-note|alias]]";
    const expectedOutput = "[[important-note]] and regular-note and [[important-note|alias]]";
    const result = removeWikilinks(inputText, true, ['important-note']);
    expect(result).toBe(expectedOutput);
  });

  test('wikilink whitelist - multiple whitelisted items', () => {
    const inputText = "[[note1]] and [[note2]] and [[note3]]";
    const expectedOutput = "[[note1]] and [[note2]] and note3";
    const result = removeWikilinks(inputText, true, ['note1', 'note2']);
    expect(result).toBe(expectedOutput);
  });

  test('wikilink whitelist - case insensitive matching', () => {
    const inputText = "[[Important-Note]] and [[other-note]]";
    const expectedOutput = "[[Important-Note]] and other-note";
    const result = removeWikilinks(inputText, true, ['important-note']);
    expect(result).toBe(expectedOutput);
  });

  test('wikilink whitelist - exact path matching required', () => {
    const inputText = "[[folder/important-file.md]] and [[important-file.md]] and [[folder/other-file.md]]";
    const expectedOutput = "folder/important-file.md and [[important-file.md]] and folder/other-file.md";
    const result = removeWikilinks(inputText, true, ['important-file.md']);
    expect(result).toBe(expectedOutput);
  });

  test('wikilink whitelist - with aliases (matches path part)', () => {
    const inputText = "[[whitelisted-note|Display Name]] and [[regular-note|Other Name]]";
    const expectedOutput = "[[whitelisted-note|Display Name]] and Other Name";
    const result = removeWikilinks(inputText, true, ['whitelisted-note']);
    expect(result).toBe(expectedOutput);
  });

  test('wikilink whitelist - does not affect image embeds', () => {
    const inputText = "![[important-image.png]] and [[important-image.png]]";
    const expectedOutput = " and [[important-image.png]]";
    const result = removeWikilinks(inputText, true, ['important-image.png']);
    expect(result).toBe(expectedOutput);
  });

  test('wikilink whitelist - empty whitelist behaves normally', () => {
    const inputText = "[[note1]] and [[note2]]";
    const expectedOutput = "note1 and note2";
    const result = removeWikilinks(inputText, true, []);
    expect(result).toBe(expectedOutput);
  });

  test('wikilink whitelist - partial matches are not whitelisted', () => {
    const inputText = "[[important]] and [[very-important]] and [[important-note]]";
    const expectedOutput = "[[important]] and very-important and important-note";
    const result = removeWikilinks(inputText, true, ['important']);
    expect(result).toBe(expectedOutput);
  });

});

describe('Blacklist Mode Tests - Hyperlinks', () => {
  test('blacklist mode - only remove blacklisted domains', () => {
    const inputText = "Check out [Google](https://google.com) and [Facebook](https://facebook.com) and [GitHub](https://github.com)";
    const expectedOutput = "Check out [Google](https://google.com) and Facebook and [GitHub](https://github.com)";
    const result = removeHyperlinks(inputText, true, [], 'both', true, ['facebook.com']);
    expect(result).toBe(expectedOutput);
  });

  test('blacklist mode - multiple blacklisted domains', () => {
    const inputText = "Links: [Facebook](https://facebook.com) and [Twitter](https://twitter.com) and [GitHub](https://github.com)";
    const expectedOutput = "Links: Facebook and Twitter and [GitHub](https://github.com)";
    const result = removeHyperlinks(inputText, true, [], 'both', true, ['facebook.com', 'twitter.com']);
    expect(result).toBe(expectedOutput);
  });

  test('blacklist mode - case insensitive matching', () => {
    const inputText = "Check [Facebook](https://FACEBOOK.COM) and [GitHub](https://github.com)";
    const expectedOutput = "Check Facebook and [GitHub](https://github.com)";
    const result = removeHyperlinks(inputText, true, [], 'both', true, ['facebook.com']);
    expect(result).toBe(expectedOutput);
  });

  test('blacklist mode - partial domain matching', () => {
    const inputText = "Links: [Facebook](https://www.facebook.com) and [FB Mobile](https://m.facebook.com) and [GitHub](https://github.com)";
    const expectedOutput = "Links: Facebook and FB Mobile and [GitHub](https://github.com)";
    const result = removeHyperlinks(inputText, true, [], 'both', true, ['facebook.com']);
    expect(result).toBe(expectedOutput);
  });

  test('blacklist mode - keepText false', () => {
    const inputText = "Check out [Facebook](https://facebook.com) and [GitHub](https://github.com)";
    const expectedOutput = "Check out  and [GitHub](https://github.com)";
    const result = removeHyperlinks(inputText, false, [], 'both', true, ['facebook.com']);
    expect(result).toBe(expectedOutput);
  });

  test('blacklist mode - no matches leaves text unchanged', () => {
    const inputText = "Check out [Google](https://google.com) and [GitHub](https://github.com)";
    const expectedOutput = "Check out [Google](https://google.com) and [GitHub](https://github.com)";
    const result = removeHyperlinks(inputText, true, [], 'both', true, ['facebook.com']);
    expect(result).toBe(expectedOutput);
  });

  test('blacklist mode - empty blacklist removes nothing', () => {
    const inputText = "Check out [Google](https://google.com) and [GitHub](https://github.com)";
    const expectedOutput = "Check out [Google](https://google.com) and [GitHub](https://github.com)";
    const result = removeHyperlinks(inputText, true, [], 'both', true, []);
    expect(result).toBe(expectedOutput);
  });

  test('blacklist mode - preserves wikilinks', () => {
    const inputText = "See [[wiki page]] and [Facebook](https://facebook.com) for more";
    const expectedOutput = "See [[wiki page]] and Facebook for more";
    const result = removeHyperlinks(inputText, true, [], 'both', true, ['facebook.com']);
    expect(result).toBe(expectedOutput);
  });

  test('blacklist mode - handles images', () => {
    const inputText = "![Facebook logo](https://facebook.com/logo.png) and [GitHub](https://github.com)";
    const expectedOutput = " and [GitHub](https://github.com)";
    const result = removeHyperlinks(inputText, true, [], 'both', true, ['facebook.com']);
    expect(result).toBe(expectedOutput);
  });

  test('blacklist mode - ignores link type filtering', () => {
    const inputText = "[Internal](page.md) and [Facebook](https://facebook.com) and [GitHub](https://github.com)";
    const expectedOutput = "[Internal](page.md) and Facebook and [GitHub](https://github.com)";
    // Even with 'internal' filter, blacklist mode should only care about blacklist
    const result = removeHyperlinks(inputText, true, [], 'internal', true, ['facebook.com']);
    expect(result).toBe(expectedOutput);
  });
});

describe('Blacklist Mode Tests - Wikilinks', () => {
  test('wikilink blacklist - only remove blacklisted wikilinks', () => {
    const inputText = "[[important-note]] and [[temporary-note]] and [[regular-note]]";
    const expectedOutput = "[[important-note]] and temporary-note and [[regular-note]]";
    const result = removeWikilinks(inputText, true, [], true, ['temporary-note']);
    expect(result).toBe(expectedOutput);
  });

  test('wikilink blacklist - multiple blacklisted items', () => {
    const inputText = "[[note1]] and [[draft]] and [[note2]] and [[temporary]]";
    const expectedOutput = "[[note1]] and draft and [[note2]] and temporary";
    const result = removeWikilinks(inputText, true, [], true, ['draft', 'temporary']);
    expect(result).toBe(expectedOutput);
  });

  test('wikilink blacklist - case insensitive matching', () => {
    const inputText = "[[Important-Note]] and [[DRAFT]] and [[other-note]]";
    const expectedOutput = "[[Important-Note]] and DRAFT and [[other-note]]";
    const result = removeWikilinks(inputText, true, [], true, ['draft']);
    expect(result).toBe(expectedOutput);
  });

  test('wikilink blacklist - exact path matching required', () => {
    const inputText = "[[draft]] and [[draft-note]] and [[my-draft]]";
    const expectedOutput = "draft and [[draft-note]] and [[my-draft]]";
    // Only exact match 'draft' should be removed, partial matches like 'draft-note' should remain
    const result = removeWikilinks(inputText, true, [], true, ['draft']);
    expect(result).toBe(expectedOutput);
  });

  test('wikilink blacklist - works with aliases, matches path part', () => {
    const inputText = "[[draft|My Draft]] and [[important-note|Important]] and [[draft-copy]]";
    const expectedOutput = "My Draft and [[important-note|Important]] and [[draft-copy]]";
    const result = removeWikilinks(inputText, true, [], true, ['draft']);
    expect(result).toBe(expectedOutput);
  });

  test('wikilink blacklist - keepAlias false behavior', () => {
    const inputText = "[[draft|My Draft]] and [[important-note|Important]]";
    const expectedOutput = "draft and [[important-note|Important]]";
    const result = removeWikilinks(inputText, false, [], true, ['draft']);
    expect(result).toBe(expectedOutput);
  });

  test('wikilink blacklist - handles image embeds', () => {
    const inputText = "![[draft-image.png]] and [[draft]] and [[important-note]]";
    const expectedOutput = " and draft and [[important-note]]";
    // Image embeds should still be removed regardless of blacklist for images
    const result = removeWikilinks(inputText, true, [], true, ['draft']);
    expect(result).toBe(expectedOutput);
  });

  test('wikilink blacklist - empty blacklist removes nothing', () => {
    const inputText = "[[note1]] and [[note2]] and [[note3]]";
    const expectedOutput = "[[note1]] and [[note2]] and [[note3]]";
    const result = removeWikilinks(inputText, true, [], true, []);
    expect(result).toBe(expectedOutput);
  });

  test('wikilink blacklist - preserves hyperlinks', () => {
    const inputText = "[[draft]] and [GitHub](https://github.com) for reference";
    const expectedOutput = "draft and [GitHub](https://github.com) for reference";
    const result = removeWikilinks(inputText, true, [], true, ['draft']);
    expect(result).toBe(expectedOutput);
  });
});

describe('Embed type filtering', () => {
  const allEnabled: EmbedTypeOptions = {
    images: true,
    base: true,
    canvas: true,
    pdf: true,
    audioVideo: true,
    notes: true
  };

  function only(disabled: keyof EmbedTypeOptions): EmbedTypeOptions {
    return { ...allEnabled, [disabled]: false };
  }

  test('getEmbedCategory classifies extensions', () => {
    expect(getEmbedCategory('Image 01.png')).toBe('images');
    expect(getEmbedCategory('Base 01.base')).toBe('base');
    expect(getEmbedCategory('Canvas 01.canvas')).toBe('canvas');
    expect(getEmbedCategory('PDF 01.pdf')).toBe('pdf');
    expect(getEmbedCategory('Track 01.opus')).toBe('audioVideo');
    expect(getEmbedCategory('Video 01.mp4')).toBe('audioVideo');
    expect(getEmbedCategory('Some Note')).toBe('notes');
    expect(getEmbedCategory('Note.unknownext')).toBe('notes');
  });

  test('getEmbedCategory handles angle brackets, %20, alias, and subpath', () => {
    expect(getEmbedCategory('<Image 01.png>')).toBe('images');
    expect(getEmbedCategory('Image%2001.png')).toBe('images');
    expect(getEmbedCategory('Image 01.png|300')).toBe('images');
    expect(getEmbedCategory('PDF 01.pdf#page=3')).toBe('pdf');
    expect(getEmbedCategory('Note#Heading')).toBe('notes');
  });

  test('wikilink embeds - all types removed when all enabled', () => {
    const inputText = "![[Image 01.png]] ![[Base 01.base]] ![[Canvas 01.canvas]] ![[PDF 01.pdf]] ![[Track 01.opus]] ![[Some Note]]";
    const expectedOutput = "     ";
    const result = removeWikilinks(inputText, true, [], false, [], allEnabled);
    expect(result).toBe(expectedOutput);
  });

  test('wikilink image embed kept when images disabled', () => {
    const inputText = "![[Image 01.png]] and ![[PDF 01.pdf]]";
    const expectedOutput = "![[Image 01.png]] and ";
    const result = removeWikilinks(inputText, true, [], false, [], only('images'));
    expect(result).toBe(expectedOutput);
  });

  test('wikilink image embed with size alias kept when images disabled', () => {
    const inputText = "![[Image 01.png|300]]";
    const result = removeWikilinks(inputText, true, [], false, [], only('images'));
    expect(result).toBe(inputText);
  });

  test('wikilink base embed kept when base disabled', () => {
    const inputText = "![[Base 01.base]] and ![[Image 01.png]]";
    const expectedOutput = "![[Base 01.base]] and ";
    const result = removeWikilinks(inputText, true, [], false, [], only('base'));
    expect(result).toBe(expectedOutput);
  });

  test('wikilink canvas embed kept when canvas disabled', () => {
    const inputText = "![[Canvas 01.canvas]]";
    const result = removeWikilinks(inputText, true, [], false, [], only('canvas'));
    expect(result).toBe(inputText);
  });

  test('wikilink pdf embed with subpath kept when pdf disabled', () => {
    const inputText = "![[PDF 01.pdf#page=3]]";
    const result = removeWikilinks(inputText, true, [], false, [], only('pdf'));
    expect(result).toBe(inputText);
  });

  test('wikilink audio embed kept when audioVideo disabled', () => {
    const inputText = "![[Track 01.opus]]";
    const result = removeWikilinks(inputText, true, [], false, [], only('audioVideo'));
    expect(result).toBe(inputText);
  });

  test('wikilink note embed kept when notes disabled', () => {
    const inputText = "![[Some Note]] and ![[Note#Heading]] and ![[Image 01.png]]";
    const expectedOutput = "![[Some Note]] and ![[Note#Heading]] and ";
    const result = removeWikilinks(inputText, true, [], false, [], only('notes'));
    expect(result).toBe(expectedOutput);
  });

  test('regular wikilinks unaffected by embed type filter', () => {
    const inputText = "[[Some Note|alias]] and ![[Image 01.png]]";
    const expectedOutput = "alias and ![[Image 01.png]]";
    const result = removeWikilinks(inputText, true, [], false, [], only('images'));
    expect(result).toBe(expectedOutput);
  });

  test('markdown image embed kept when images disabled', () => {
    const inputText = "![text](Image01.png) and [link](https://example.com)";
    const expectedOutput = "![text](Image01.png) and link";
    const result = removeHyperlinks(inputText, true, [], 'both', false, [], only('images'));
    expect(result).toBe(expectedOutput);
  });

  test('markdown embed with angle brackets kept when images disabled', () => {
    const inputText = "![text](<Image 01.png>)";
    const result = removeHyperlinks(inputText, true, [], 'both', false, [], only('images'));
    expect(result).toBe(inputText);
  });

  test('markdown embed with %20 encoded path kept when images disabled', () => {
    const inputText = "![text](Image%2001.png)";
    const result = removeHyperlinks(inputText, true, [], 'both', false, [], only('images'));
    expect(result).toBe(inputText);
  });

  test('markdown pdf embed removed while image kept', () => {
    const inputText = "![text](<Image 01.png>) and ![doc](<PDF 01.pdf>)";
    const expectedOutput = "![text](<Image 01.png>) and ";
    const result = removeHyperlinks(inputText, true, [], 'both', false, [], only('images'));
    expect(result).toBe(expectedOutput);
  });

  test('markdown embeds removed when all types enabled', () => {
    const inputText = "![text](<Image 01.png>) and ![doc](<PDF 01.pdf>)";
    const expectedOutput = " and ";
    const result = removeHyperlinks(inputText, true, [], 'both', false, [], allEnabled);
    expect(result).toBe(expectedOutput);
  });

  test('backward compat - omitted embedTypes removes all embeds', () => {
    expect(removeWikilinks("![[Image 01.png]]", true)).toBe('');
    expect(removeHyperlinks("![text](Image01.png)", true)).toBe('');
  });
});
