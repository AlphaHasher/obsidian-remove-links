import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { removeHyperlinks, removeWikilinks } from './removeLinks';

interface HyperlinkRemoverSettings {
	removeHyperlinks: boolean;
	keepHyperlinkText: boolean;
	hyperlinkType: 'both' | 'internal' | 'external';
	removeWikilinks: boolean;
	keepWikilinkAliases: boolean;
	hyperlinkWhitelist: string;
	wikilinkWhitelist: string;
	hyperlinkBlacklist: string;
	wikilinkBlacklist: string;
}

const DEFAULT_SETTINGS: HyperlinkRemoverSettings = {
	removeHyperlinks: true,
	keepHyperlinkText: true,
	hyperlinkType: 'both',
	removeWikilinks: true,
	keepWikilinkAliases: true,
	hyperlinkWhitelist: '',
	wikilinkWhitelist: '',
	hyperlinkBlacklist: '',
	wikilinkBlacklist: ''
}

export default class HyperlinkRemover extends Plugin {
	settings: HyperlinkRemoverSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new HyperlinkRemoverSettingTab(this.app, this));

		this.addCommand({
			id: 'remove-links-from-selection',
			name: 'Remove links from selection',
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
			id: 'remove-links-from-file',
			name: 'Remove links from file',
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

		this.addCommand({
			id: 'remove-external-links-from-file',
			name: 'Remove external links from file',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const content = editor.getValue();
				const updatedContent = this.processText(content, 'external');
				if (content !== updatedContent) {
					editor.setValue(updatedContent);
					new Notice('External links removed from file');
				} else {
					new Notice('No external links found in the file');
				}
			}
		});

		this.addCommand({
			id: 'remove-internal-links-from-file',
			name: 'Remove internal links from file',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const content = editor.getValue();
				const updatedContent = this.processText(content, 'internal');
				if (content !== updatedContent) {
					editor.setValue(updatedContent);
					new Notice('Internal links removed from file');
				} else {
					new Notice('No internal links found in the file');
				}
			}
		});

		// Blacklist-based commands
		this.addCommand({
			id: 'remove-blacklisted-links-from-selection',
			name: 'Remove blacklisted links from selection',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const selection = editor.getSelection();
				if (selection) {
					const processedText = this.processText(selection, undefined, true);
					if (selection !== processedText) {
						editor.replaceSelection(processedText);
						new Notice('Blacklisted links removed from selection');
					} else {
						new Notice('No blacklisted links found in selection');
					}
				} else {
					new Notice('No text selected to remove links from');
				}
			}
		});

		this.addCommand({
			id: 'remove-blacklisted-links-from-file',
			name: 'Remove blacklisted links from file',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const content = editor.getValue();
				const updatedContent = this.processText(content, undefined, true);
				if (content !== updatedContent) {
					editor.setValue(updatedContent);
					new Notice('Blacklisted links removed from file');
				} else {
					new Notice('No blacklisted links found in the file');
				}
			}
		});

		// Context menu / Remove links / Selection
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

		// Context menu / Remove links / File
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

	processText(text: string, hyperlinkType?: 'both' | 'internal' | 'external', blacklistMode: boolean = false): string {
		let result = text;
		
		if (blacklistMode) {
			// Parse blacklists from comma-separated strings
			const hyperlinkBlacklist = this.settings.hyperlinkBlacklist
				.split(',')
				.map(item => item.trim())
				.filter(item => item.length > 0);
			
			const wikilinkBlacklist = this.settings.wikilinkBlacklist
				.split(',')
				.map(item => item.trim())
				.filter(item => item.length > 0);
			
			// Process hyperlinks with blacklist, only remove if in blacklist)
			if (hyperlinkBlacklist.length > 0) {
				const linkType = hyperlinkType || 'both';
				result = removeHyperlinks(result, this.settings.keepHyperlinkText, [], linkType, true, hyperlinkBlacklist);
			}

			// Process wikilinks with blacklist, only remove if in blacklist
			if (wikilinkBlacklist.length > 0) {
				result = removeWikilinks(result, this.settings.keepWikilinkAliases, [], true, wikilinkBlacklist);
			}
		} else {
			// Process hyperlinks if enabled in settings or if specific mode is provided
			if (this.settings.removeHyperlinks || hyperlinkType) {
				// Parse whitelist from comma-separated string
				const whitelist = this.settings.hyperlinkWhitelist
					.split(',')
					.map(item => item.trim())
					.filter(item => item.length > 0);
				
				const linkType = hyperlinkType || this.settings.hyperlinkType;
				result = removeHyperlinks(result, this.settings.keepHyperlinkText, whitelist, linkType);
			}
			
			if (this.settings.removeWikilinks) {
				// Parse wikilink whitelist from comma-separated string
				const wikilinkWhitelist = this.settings.wikilinkWhitelist
					.split(',')
					.map(item => item.trim())
					.filter(item => item.length > 0);
				
				result = removeWikilinks(result, this.settings.keepWikilinkAliases, wikilinkWhitelist);
			}
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

	private checkAndShowDisabledWarning(): void {
		// Check if both features are disabled
		if (!this.plugin.settings.removeHyperlinks && !this.plugin.settings.removeWikilinks) {
			new Notice('⚠️ Warning: Both hyperlink and wikilink removal is disabled. The plugin is effectively disabled.', 5000);
		}
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		// Check if both features are disabled and show warning
		const bothDisabled = !this.plugin.settings.removeHyperlinks && !this.plugin.settings.removeWikilinks;
		if (bothDisabled) {
			const warningDiv = containerEl.createDiv({
				cls: 'setting-item',
				attr: { style: 'background-color: #ffeaa7; border: 1px solid #fdcb6e; border-radius: 4px; padding: 10px; margin-bottom: 15px;' }
			});
			warningDiv.createEl('div', {
				text: '⚠️ Warning: Both hyperlink and wikilink removal is disabled. The plugin is effectively disabled.',
				attr: { style: 'color: #e17055; font-weight: bold;' }
			});
		}

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
					this.checkAndShowDisabledWarning();
				}));

		// Only show the text option if hyperlinks removal is enabled
		if (this.plugin.settings.removeHyperlinks) {
			new Setting(containerEl)
				.setName('Hyperlink Type')
				.setDesc('Choose which types of hyperlinks to remove from context menu. (command mode overrides this setting)')
				.addDropdown(dropdown => dropdown
					.addOption('both', 'Both Internal and External')
					.addOption('internal', 'Internal Links Only')
					.addOption('external', 'External Links Only')
					.setValue(this.plugin.settings.hyperlinkType)
					.onChange(async (value) => {
						this.plugin.settings.hyperlinkType = value as 'both' | 'internal' | 'external';
						await this.plugin.saveSettings();
					}));

			new Setting(containerEl)
				.setName('Keep Hyperlink Text')
				.setDesc('When removing hyperlinks [text](url), keep the link text')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.keepHyperlinkText)
					.onChange(async (value) => {
						this.plugin.settings.keepHyperlinkText = value;
						await this.plugin.saveSettings();
					}));

			new Setting(containerEl)
				.setName('Hyperlink Whitelist')
				.setDesc('Comma-separated list of domains/URLs to never remove (e.g., wikipedia.org, github.com)')
				.addText(text => text
					.setPlaceholder('wikipedia.org, github.com')
					.setValue(this.plugin.settings.hyperlinkWhitelist)
					.onChange(async (value) => {
						this.plugin.settings.hyperlinkWhitelist = value;
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
					this.checkAndShowDisabledWarning();
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

			new Setting(containerEl)
				.setName('Wikilink Whitelist')
				.setDesc('Comma-separated list of wikilink paths/names to never remove (e.g., important-note, folder/file)')
				.addText(text => text
					.setPlaceholder('important-note, templates/template')
					.setValue(this.plugin.settings.wikilinkWhitelist)
					.onChange(async (value) => {
						this.plugin.settings.wikilinkWhitelist = value;
						await this.plugin.saveSettings();
					}));
		}

		// Blacklist section
		containerEl.createEl('h3', {text: 'Blacklist Mode'});

		const blacklistDesc = containerEl.createEl('div', {
			text: 'This mode only removes links that match the specified domains/paths. Use the dedicated "Remove blacklisted links" commands to activate this mode.',
			attr: { style: 'margin-bottom: 10px; color: var(--text-muted);' }
		});

		new Setting(containerEl)
			.setName('Hyperlink Blacklist')
			.setDesc('Comma-separated list of domains/URLs to remove when using blacklist commands (e.g., facebook.com, twitter.com)')
			.addText(text => text
				.setPlaceholder('facebook.com, twitter.com')
				.setValue(this.plugin.settings.hyperlinkBlacklist)
				.onChange(async (value) => {
					this.plugin.settings.hyperlinkBlacklist = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Wikilink Blacklist')
			.setDesc('Comma-separated list of wikilink paths/names to remove when using blacklist commands (e.g., temporary-note, draft)')
			.addText(text => text
				.setPlaceholder('temporary-note, draft')
				.setValue(this.plugin.settings.wikilinkBlacklist)
				.onChange(async (value) => {
					this.plugin.settings.wikilinkBlacklist = value;
					await this.plugin.saveSettings();
				}));
	}
}

