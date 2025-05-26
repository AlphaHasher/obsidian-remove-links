import { Editor, MarkdownView, Notice, Plugin } from 'obsidian';

export default class HyperlinkRemover extends Plugin {
	async onload() {

		this.addCommand({
			id: 'remove-hyperlinks-from-selection',
			name: 'Remove hyperlinks from selection',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				const selection = editor.getSelection();
				if (selection) {
					const updatedSelection = selection.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
					editor.replaceSelection(updatedSelection);
				} else {
					new Notice('No text selected to remove hyperlinks from.');
				}
			}
		});
		this.addCommand({
			id: 'remove-hyperlinks-from-file',
			name: 'Remove hyperlinks from file',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const content = editor.getValue();
				const updatedContent = content.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
				editor.setValue(updatedContent);
			}
		});

	}

	onunload() {

	}
}