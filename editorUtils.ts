import type { Editor } from "obsidian";

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

/**
 * Diff two documents into per-line changes.
 *
 * A plain prefix/suffix diff produces one span stretching from the first
 * changed character to the last one — when links are scattered through the
 * note that span covers nearly the whole document, and CodeMirror cannot map
 * the cursor or the viewport anchor through a span that swallowed them, so
 * both collapse to the start of the change. Per-line changes keep every span
 * small enough that mapping works and the view stays put.
 */
export function diffChanges(oldText: string, newText: string): TextDiff[] {
	if (oldText === newText) {
		return [];
	}

	const oldLines = oldText.split("\n");
	const newLines = newText.split("\n");

	let start = 0;
	const maxStart = Math.min(oldLines.length, newLines.length);
	while (start < maxStart && oldLines[start] === newLines[start]) {
		start++;
	}

	let end = 0;
	const maxEnd = maxStart - start;
	while (
		end < maxEnd &&
		oldLines[oldLines.length - 1 - end] ===
			newLines[newLines.length - 1 - end]
	) {
		end++;
	}

	let offset = 0;
	for (let i = 0; i < start; i++) {
		offset += (oldLines[i] ?? "").length + 1;
	}

	const changes: TextDiff[] = [];
	const oldMidCount = oldLines.length - end - start;
	const newMidCount = newLines.length - end - start;

	if (oldMidCount === newMidCount) {
		// Line counts match (the usual case for inline link removal):
		// one small change per modified line.
		for (let i = 0; i < oldMidCount; i++) {
			const oldLine = oldLines[start + i] ?? "";
			const newLine = newLines[start + i] ?? "";
			const diff = diffRange(oldLine, newLine);
			if (diff) {
				changes.push({
					from: offset + diff.from,
					to: offset + diff.to,
					insert: diff.insert,
				});
			}
			offset += oldLine.length + 1;
		}
	} else {
		// Line counts differ: fall back to one change over the modified block.
		const oldMid = oldLines.slice(start, oldLines.length - end).join("\n");
		const newMid = newLines.slice(start, newLines.length - end).join("\n");
		const diff = diffRange(oldMid, newMid);
		if (diff) {
			changes.push({
				from: offset + diff.from,
				to: offset + diff.to,
				insert: diff.insert,
			});
		}
	}

	return changes;
}

/** Structural view of the CodeMirror EditorView that Obsidian exposes as `Editor.cm`. */
interface CodeMirrorView {
	dispatch(spec: { changes: TextDiff[] }): void;
}

/**
 * Replace the editor's content, keeping the cursor and viewport in place.
 * Returns false when the new content is identical to the current content.
 *
 * Nothing is touched after the change is applied: CodeMirror maps the selection
 * through it and keeps the scroll anchored on its own. Restoring the selection
 * afterwards would scroll it into view, and restoring a pixel scroll offset
 * would point at the wrong line once the text above the viewport shrank.
 */
export function applyTextUpdate(editor: Editor, newContent: string): boolean {
	const changes = diffChanges(editor.getValue(), newContent);
	if (changes.length === 0) {
		return false;
	}

	const view = (editor as Editor & { cm?: CodeMirrorView }).cm;
	if (view && typeof view.dispatch === "function") {
		view.dispatch({ changes });
	} else {
		// Apply back-to-front so earlier offsets stay valid.
		for (let i = changes.length - 1; i >= 0; i--) {
			const change = changes[i];
			if (!change) {
				continue;
			}
			editor.replaceRange(
				change.insert,
				editor.offsetToPos(change.from),
				editor.offsetToPos(change.to),
			);
		}
	}

	return true;
}
