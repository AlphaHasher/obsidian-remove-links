import type { Editor, EditorPosition } from "obsidian";

export interface TextDiff {
	from: number;
	to: number;
	insert: string;
}

/**
 * Narrow a whole-document rewrite down to the single span that actually changed,
 * so the editor can map the cursor and scroll position through the edit instead
 * of collapsing them to the start of the document.
 */
export function diffRange(oldText: string, newText: string): TextDiff | null {
	if (oldText === newText) {
		return null;
	}

	let prefix = 0;
	const maxPrefix = Math.min(oldText.length, newText.length);
	while (prefix < maxPrefix && oldText[prefix] === newText[prefix]) {
		prefix++;
	}

	let suffix = 0;
	const maxSuffix = maxPrefix - prefix;
	while (
		suffix < maxSuffix &&
		oldText[oldText.length - 1 - suffix] ===
			newText[newText.length - 1 - suffix]
	) {
		suffix++;
	}

	return {
		from: prefix,
		to: oldText.length - suffix,
		insert: newText.slice(prefix, newText.length - suffix),
	};
}

function clampPosition(
	editor: Editor,
	position: EditorPosition,
): EditorPosition {
	const line = Math.min(Math.max(position.line, 0), editor.lastLine());
	const ch = Math.min(Math.max(position.ch, 0), editor.getLine(line).length);
	return { line, ch };
}

/**
 * Replace the editor's content, keeping the cursor and viewport in place.
 * Returns false when the new content is identical to the current content.
 */
export function applyTextUpdate(editor: Editor, newContent: string): boolean {
	const diff = diffRange(editor.getValue(), newContent);
	if (!diff) {
		return false;
	}

	const anchor = editor.getCursor("anchor");
	const head = editor.getCursor("head");
	const scroll = editor.getScrollInfo();

	editor.replaceRange(
		diff.insert,
		editor.offsetToPos(diff.from),
		editor.offsetToPos(diff.to),
	);

	editor.setSelection(
		clampPosition(editor, anchor),
		clampPosition(editor, head),
	);
	editor.scrollTo(scroll.left, scroll.top);

	return true;
}
