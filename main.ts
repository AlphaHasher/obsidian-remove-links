import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { removeHyperlinks, removeWikilinks } from './removeLinks';

interface HyperlinkRemoverSettings {
	removeHyperlinks: boolean;
	keepHyperlinkText: boolean;
	removeWikilinks: boolean;
	keepWikilinkAliases: boolean;
}

const DEFAULT_SETTINGS: HyperlinkRemoverSettings = {
	removeHyperlinks: true,
	keepHyperlinkText: true,
	removeWikilinks: true,
	keepWikilinkAliases: true
}

export default class HyperlinkRemover extends Plugin {
	settings: HyperlinkRemoverSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new HyperlinkRemoverSettingTab(this.app, this));

		this.addCommand({
			id: 'remove-hyperlinks-from-selection',
			name: 'Remove hyperlinks from selection',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const selection = editor.getSelection();
				if (selection) {
					const processedText = this.processText(selection);
					if (selection !== processedText) {
						editor.replaceSelection(processedText);
						new Notice('Links removed from selection');
					} else {
						new Notice('No links found in selection');
					}
				} else {
					new Notice('No text selected to remove links from');
				}
			}
		});
		this.addCommand({
			id: 'remove-hyperlinks-from-file',
			name: 'Remove hyperlinks from file',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const content = editor.getValue();
				const updatedContent = this.processText(content);
				if (content !== updatedContent) {
					editor.setValue(updatedContent);
					new Notice('Links removed from file');
				} else {
					new Notice('No links found in the file');
				}
			}
		});

		// Context menu / Remove hyperlinks / Selection
		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor, view) => {
				menu.addItem((item) => {
					item.setTitle("Remove links from selection")
						.setIcon("unlink")
						.setDisabled(!editor.somethingSelected())
						.onClick(() => {
							const selection = editor.getSelection();
							const updatedSelection = this.processText(selection);
							if (selection !== updatedSelection) {
								editor.replaceSelection(updatedSelection);
								new Notice('Links removed from selection');
							} else {
								new Notice('No links found in the selection');
							}
						});
				});
			})
		);

		// Context menu / Remove hyperlinks / File
		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor, view) => {
				menu.addItem((item) => {
					item.setTitle("Remove links from file")
						.setIcon("unlink")
						.onClick(() => {
							const content = editor.getValue();
							const updatedContent = this.processText(content);
							if (content !== updatedContent) {
								editor.setValue(updatedContent);
								new Notice('Links removed from file');
							} else {
								new Notice('No links found in the file');
							}
						});
				});
			})
		);

	}

	onunload() {

	}

	processText(text: string): string {
		let result = text;
		
		if (this.settings.removeHyperlinks) {
			result = removeHyperlinks(result, this.settings.keepHyperlinkText);
		}
		
		if (this.settings.removeWikilinks) {
			result = removeWikilinks(result, this.settings.keepWikilinkAliases);
		}
		
		return result;
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class HyperlinkRemoverSettingTab extends PluginSettingTab {
	plugin: HyperlinkRemover;

	constructor(app: App, plugin: HyperlinkRemover) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		// Hyperlinks section
		containerEl.createEl('h3', {text: 'Hyperlinks'});

		new Setting(containerEl)
			.setName('Remove Hyperlinks')
			.setDesc('Remove markdown-style links [text](url) and images ![text](url)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.removeHyperlinks)
				.onChange(async (value) => {
					this.plugin.settings.removeHyperlinks = value;
					// If hyperlinks are disabled, also disable keeping text
					if (!value) {
						this.plugin.settings.keepHyperlinkText = false;
					}
					await this.plugin.saveSettings();
					this.display(); // Refresh the display to show/hide the text option
				}));

		// Only show the text option if hyperlinks removal is enabled
		if (this.plugin.settings.removeHyperlinks) {
			new Setting(containerEl)
				.setName('Keep Hyperlink Text')
				.setDesc('When removing hyperlinks [text](url), keep the link text')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.keepHyperlinkText)
					.onChange(async (value) => {
						this.plugin.settings.keepHyperlinkText = value;
						await this.plugin.saveSettings();
					}));
		}

		// Wikilinks section
		containerEl.createEl('h3', {text: 'Wikilinks'});

		new Setting(containerEl)
			.setName('Remove Wikilinks')
			.setDesc('Remove Obsidian-style wikilinks [[link]] and image embeds ![[image]]')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.removeWikilinks)
				.onChange(async (value) => {
					this.plugin.settings.removeWikilinks = value;
					// If wikilinks are disabled, also disable keeping aliases
					if (!value) {
						this.plugin.settings.keepWikilinkAliases = false;
					}
					await this.plugin.saveSettings();
					this.display(); // Refresh the display to show/hide the alias option
				}));

		// Only show the alias option if wikilinks removal is enabled
		if (this.plugin.settings.removeWikilinks) {
			new Setting(containerEl)
				.setName('Keep Wikilink Aliases')
				.setDesc('When removing wikilinks with aliases [[link|alias]], keep the alias text')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.keepWikilinkAliases)
					.onChange(async (value) => {
						this.plugin.settings.keepWikilinkAliases = value;
						await this.plugin.saveSettings();
					}));
		}
	}
}

