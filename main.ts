import { App, Editor, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { EmbedTypeOptions, removeCitations, removeHyperlinks, removeWikilinks, removeWikipediaCitations } from './removeLinks';

interface HyperlinkRemoverSettings {
	removeHyperlinks: boolean;
	keepHyperlinkText: boolean;
	removeWikipediaCitations: boolean;
	hyperlinkType: 'both' | 'internal' | 'external';
	removeWikilinks: boolean;
	keepWikilinkAliases: boolean;
	hyperlinkWhitelist: string;
	wikilinkWhitelist: string;
	hyperlinkBlacklist: string;
	wikilinkBlacklist: string;
	removeImageEmbeds: boolean;
	removeBaseEmbeds: boolean;
	removeCanvasEmbeds: boolean;
	removePdfEmbeds: boolean;
	removeAudioVideoEmbeds: boolean;
	removeNoteEmbeds: boolean;
}

const DEFAULT_SETTINGS: HyperlinkRemoverSettings = {
	removeHyperlinks: true,
	keepHyperlinkText: true,
	removeWikipediaCitations: false,
	hyperlinkType: 'both',
	removeWikilinks: true,
	keepWikilinkAliases: true,
	hyperlinkWhitelist: '',
	wikilinkWhitelist: '',
	hyperlinkBlacklist: '',
	wikilinkBlacklist: '',
	removeImageEmbeds: true,
	removeBaseEmbeds: true,
	removeCanvasEmbeds: true,
	removePdfEmbeds: true,
	removeAudioVideoEmbeds: true,
	removeNoteEmbeds: true
}

export default class HyperlinkRemover extends Plugin {
	settings!: HyperlinkRemoverSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new HyperlinkRemoverSettingTab(this.app, this));

		this.addCommand({
			id: 'remove-links-from-selection',
			name: 'Remove links from selection',
			editorCallback: (editor: Editor) => {
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
			editorCallback: (editor: Editor) => {
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
			editorCallback: (editor: Editor) => {
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
			editorCallback: (editor: Editor) => {
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

		this.addCommand({
			id: 'remove-blacklisted-links-from-selection',
			name: 'Remove blacklisted links from selection',
			editorCallback: (editor: Editor) => {
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
			editorCallback: (editor: Editor) => {
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

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor) => {
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

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor) => {
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

	onunload() {}

	getEmbedTypeOptions(): EmbedTypeOptions {
		return {
			images: this.settings.removeImageEmbeds,
			base: this.settings.removeBaseEmbeds,
			canvas: this.settings.removeCanvasEmbeds,
			pdf: this.settings.removePdfEmbeds,
			audioVideo: this.settings.removeAudioVideoEmbeds,
			notes: this.settings.removeNoteEmbeds
		};
	}

	processText(text: string, hyperlinkType?: 'both' | 'internal' | 'external', blacklistMode = false): string {
		let result = text;
		const embedTypes = this.getEmbedTypeOptions();

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
				result = removeHyperlinks(result, this.settings.keepHyperlinkText, [], linkType, true, hyperlinkBlacklist, embedTypes);
			}

			// Process wikilinks with blacklist, only remove if in blacklist
			if (wikilinkBlacklist.length > 0) {
				result = removeWikilinks(result, this.settings.keepWikilinkAliases, [], true, wikilinkBlacklist, embedTypes);
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

				// Strip AI citation links (e.g. [[1](url)], [[1](url), [2](url)])
				// before normal hyperlink removal. Citations are external by nature.
				if (linkType !== 'internal') {
					result = removeCitations(result);
				}

				if (this.settings.removeWikipediaCitations) {
					result = removeWikipediaCitations(result);
				}

				result = removeHyperlinks(result, this.settings.keepHyperlinkText, whitelist, linkType, false, [], embedTypes);
			}

			if (this.settings.removeWikilinks) {
				// Parse wikilink whitelist from comma-separated string
				const wikilinkWhitelist = this.settings.wikilinkWhitelist
					.split(',')
					.map(item => item.trim())
					.filter(item => item.length > 0);

				result = removeWikilinks(result, this.settings.keepWikilinkAliases, wikilinkWhitelist, false, [], embedTypes);
			}
		}

		return result;
	}

	async loadSettings() {
		const data = await this.loadData() as Partial<HyperlinkRemoverSettings>;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
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
		if (!this.plugin.settings.removeHyperlinks && !this.plugin.settings.removeWikilinks) {
			new Notice('⚠️ Warning: Both hyperlink and wikilink removal is disabled. The plugin is effectively disabled.', 5000);
		}
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		const bothDisabled = !this.plugin.settings.removeHyperlinks && !this.plugin.settings.removeWikilinks;
		if (bothDisabled) {
			const warningDiv = containerEl.createDiv({
				cls: 'setting-item',
				attr: { style: 'background-color: #ffeaa7; border: 1px solid #fdcb6e; border-radius: 4px; padding: 10px; margin-bottom: 15px;' }
			});
			warningDiv.createDiv({
				text: '⚠️ Warning: Both hyperlink and wikilink removal is disabled. The plugin is effectively disabled.',
				attr: { style: 'color: #e17055; font-weight: bold;' }
			});
		}

		new Setting(containerEl).setName('Hyperlinks').setHeading();

		new Setting(containerEl)
			.setName('Remove Hyperlinks')
			.setDesc('Remove markdown-style links [text](url) and images ![text](url)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.removeHyperlinks)
				.onChange(async (value) => {
					this.plugin.settings.removeHyperlinks = value;
					if (!value) {
						this.plugin.settings.keepHyperlinkText = false;
					}
					await this.plugin.saveSettings();
					// eslint-disable-next-line @typescript-eslint/no-deprecated -- New settings display type is not yet on stable release.
					this.display();
					this.checkAndShowDisabledWarning();
				}));

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
					.setName('Remove Wikipedia Citations')
					.setDesc('Remove Wikipedia-style footnotes, e.g. "Text.[[2]](url)" -> "Text."')
					.addToggle(toggle => toggle
						.setValue(this.plugin.settings.removeWikipediaCitations)
						.onChange(async (value) => {
							this.plugin.settings.removeWikipediaCitations = value;
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

		new Setting(containerEl).setName('Wikilinks').setHeading();

		new Setting(containerEl)
			.setName('Remove Wikilinks')
			.setDesc('Remove Obsidian-style wikilinks [[link]] and image embeds ![[image]]')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.removeWikilinks)
				.onChange(async (value) => {
					this.plugin.settings.removeWikilinks = value;
					if (!value) {
						this.plugin.settings.keepWikilinkAliases = false;
					}
					await this.plugin.saveSettings();
					// eslint-disable-next-line @typescript-eslint/no-deprecated -- New settings display type is not yet on stable release.
					this.display();
					this.checkAndShowDisabledWarning();
				}));

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

		new Setting(containerEl).setName('Embeds').setHeading();

		containerEl.createDiv({
			text: 'Control which embed types get removed. Applies to both wikilink embeds ![[file]] and markdown embeds ![text](file).',
			attr: { style: 'margin-bottom: 10px; color: var(--text-muted);' }
		});

		new Setting(containerEl)
			.setName('Remove Image Embeds')
			.setDesc('Remove image embeds, e.g. ![[Image 01.png]] and ![text](Image%2001.png)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.removeImageEmbeds)
				.onChange(async (value) => {
					this.plugin.settings.removeImageEmbeds = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Remove Base Embeds')
			.setDesc('Remove base embeds, e.g. ![[Base 01.base]]')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.removeBaseEmbeds)
				.onChange(async (value) => {
					this.plugin.settings.removeBaseEmbeds = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Remove Canvas Embeds')
			.setDesc('Remove canvas embeds, e.g. ![[Canvas 01.canvas]]')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.removeCanvasEmbeds)
				.onChange(async (value) => {
					this.plugin.settings.removeCanvasEmbeds = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Remove PDF Embeds')
			.setDesc('Remove PDF embeds, e.g. ![[PDF 01.pdf]]')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.removePdfEmbeds)
				.onChange(async (value) => {
					this.plugin.settings.removePdfEmbeds = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Remove Audio & Video Embeds')
			.setDesc('Remove audio and video embeds, e.g. ![[Track 01.opus]]')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.removeAudioVideoEmbeds)
				.onChange(async (value) => {
					this.plugin.settings.removeAudioVideoEmbeds = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Remove Note Embeds')
			.setDesc('Remove note embeds and embeds with unknown file types, e.g. ![[Some Note]] and ![[Note#Heading]]')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.removeNoteEmbeds)
				.onChange(async (value) => {
					this.plugin.settings.removeNoteEmbeds = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl).setName('Blacklist Mode').setHeading();

		containerEl.createDiv({
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
