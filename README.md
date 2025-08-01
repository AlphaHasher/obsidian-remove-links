# Link Removal Plugin

- Simple and lightweight plugin for [Obsidian](https://obsidian.md/) to remove hyperlinks and wikilinks from either selections or the entire file.

## Right in the Context Menu!

<img src="https://github.com/user-attachments/assets/b267fd86-e777-434c-a5b7-cc6fd2b3cafb" width="300">

## Remove [Hyperlink](https://help.obsidian.md/links#Link+to+a+file) format in file/selection

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

<img src="https://github.com/user-attachments/assets/e57d8f80-8d96-43e2-b627-5a0cbbfe3c84" width="600">


# Release Notes

- **1.0.0**: Initial release.
- **1.1.0**: Add Notice's for hyperlink removal logic and added context menu options.
- **1.2.0**: Added unit testing (for developers) and updated hyperlink removal logic to handle more edge cases.
- **1.2.1**: Improved plugin structure, this does not affect functionality but makes it easier to maintain and extend in the future.
- **1.3.0**: Added hyperlink removal from image attachment case
- **2.0.0**: Added [WikiLinks](https://help.obsidian.md/links#Link+to+a+file) support with option to keep or remove alias 
