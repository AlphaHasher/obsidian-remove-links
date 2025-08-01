import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { removeHyperlinks, removeWikilinks } from './removeHyperlinks';

interface HyperlinkRemoverSettings {
	removeHyperlinks: boolean;
	removeWikilinks: boolean;
}

const DEFAULT_SETTINGS: HyperlinkRemoverSettings = {
	removeHyperlinks: true,
	removeWikilinks: true
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
			result = removeHyperlinks(result);
		}
		
		if (this.settings.removeWikilinks) {
			result = removeWikilinks(result);
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

		new Setting(containerEl)
			.setName('Remove Hyperlinks')
			.setDesc('Remove markdown-style links [text](url) and images ![text](url)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.removeHyperlinks)
				.onChange(async (value) => {
					this.plugin.settings.removeHyperlinks = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Remove Wikilinks')
			.setDesc('Remove Obsidian-style wikilinks [[link]] and image embeds ![[image]]')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.removeWikilinks)
				.onChange(async (value) => {
					this.plugin.settings.removeWikilinks = value;
					await this.plugin.saveSettings();
				}));
	}
}

