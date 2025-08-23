# Link Removal Plugin

Simple and lightweight plugin for [Obsidian](https://obsidian.md/) to remove hyperlinks and wikilinks from either selections or the entire file.

If you like this plugin, feel free to support the development by buying a coffee:

<a href="https://buymeacoffee.com/danielagafonov" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## Right in the Context Menu!

<img src="https://github.com/user-attachments/assets/5951f3be-5b33-4fb1-804f-e3715795f262" width="200">

## Remove [Hyperlink](https://www.markdownguide.org/basic-syntax/#links) format in file/selection

| Input                                                                               | Output                           |
| ----------------------------------------------------------------------------------- | -------------------------------- |
| `[Google](www.google.com)`                                                          | `Google`                         |
| `[text with [brackets]](https://example.com)`                                       | `text with [brackets]`           |
| `[text with \[escaped\] brackets](https://example.com)`                             | `text with \[escaped\] brackets` |
| `[OK go song](https://en.m.wikipedia.org/wiki/I_Won%27t_Let_You_Down_(OK_Go_song))` | `OK go song`                     |
| `![](image.png)`                                                                    | **REMOVED**                      |


## Remove [WikiLinks](https://help.obsidian.md/links#Link+to+a+file) format in file/selection

| Input                                         | Output                                            |
| --------------------------------------------- | ------------------------------------------------- |
| `[[example.md]]`                              | `example.md`                                      |
| `[[example.md\|alias]]`                       | `alias` **OR** **REMOVED** (depending on setting) |
| `![[example.png]]`                            | **REMOVED**                                       |
| `![[example.png\|300]]`                       | **REMOVED**                                       |
| `[[text with \\[escaped\\] brackets]]`        | `text with \\[escaped\\] brackets`                |
| `[[text with \\[escaped\\] brackets\|alias]]` | `alias` **OR** **REMOVED** (depending on setting) |


## Easy Command and Hotkey Assignment

<img src="https://github.com/user-attachments/assets/e57d8f80-8d96-43e2-b627-5a0cbbfe3c84" width="450">

## Advanced Features

### Hyperlink Type Filtering
You can choose which types of hyperlinks to remove:
- **Both Internal and External** : Removes all hyperlinks
- **Internal Links Only**: Only removes internal links like `[Page](page.md)`, `[Section](#heading)`
- **External Links Only**: Only removes external links like `[Site](https://example.com)`

### Hyperlink Whitelist
You can whitelist specific domains or URLs that should never be removed.

**Note:** Whitelist matching is case-insensitive and uses partial matching.

### Wikilink Whitelist
You can whitelist specific wikilink paths that should never be removed.

**Note:** Wikilink whitelist uses exact matching (case-insensitive). The entire wikilink path must match the whitelist entry.

### Blacklist Mode
Blacklist mode is the opposite of whitelist mode - it **only removes** links that match your specified blacklist, leaving all other links intact. This is useful when you want to remove specific unwanted links while preserving everything else.

- You can specify seperate lists for both hyperlink and wikilink blacklist

**Note:** Use the "Remove blacklisted links" commands to activate blacklist mode. This is the only place this option is available

# Release Notes

- **1.0.0**: Initial release.
- **1.1.0**: Add Notice's for hyperlink removal logic and added context menu options.
- **1.2.0**: Added unit testing (for developers) and updated hyperlink removal logic to handle more edge cases.
- **1.2.1**: Improved plugin structure, this does not affect functionality but makes it easier to maintain and extend in the future.
- **1.3.0**: Added hyperlink removal from image attachment case
- **2.0.0**: Added [WikiLinks](https://help.obsidian.md/links#Link+to+a+file) support with option to keep or remove alias
- **2.1.0**: Added optional setting to keep or remove hyperlink text in `[text](link)`
- **2.1.1**: Added hyperlink whitelist feature to preserve specified domains/URLs
- **2.2.0**: Added hyperlink type filtering (internal/external/both) and hyperlink/wikilink whitelist feature
- **2.3.0**: Added explicit commands to remove links from either internal or extrnal origin
- **2.4.0**: Added blacklist mode to explicitly remove only links you want (opposite of whitelist)
