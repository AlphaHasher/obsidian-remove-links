import { describe, expect, test } from "@jest/globals";
import type { Editor, EditorPosition } from "obsidian";

import { applyTextUpdate, diffChanges, diffRange, TextDiff } from "./editorUtils";

/**
 * Minimal Obsidian Editor, covering only the methods
 * applyTextUpdate touches. Records the calls the tests assert on.
 */
class StubEditor {
	value: string;
	cm?: { dispatch(spec: { changes: TextDiff[] }): void };
	dispatched: { changes: TextDiff[] }[] = [];
	replacedRanges: {
		insert: string;
		from: EditorPosition;
		to: EditorPosition;
	}[] = [];
	scrolledTo: { left: number; top: number }[] = [];
	selectionCalls = 0;
	setValueCalls = 0;

	constructor(value: string, { cm = true }: { cm?: boolean } = {}) {
		this.value = value;
		if (cm) {
			this.cm = {
				dispatch: (spec) => {
					this.dispatched.push(spec);
					// Apply back-to-front so earlier offsets stay valid,
					// mirroring how CodeMirror treats all changes in one
					// dispatch as simultaneous.
					for (let i = spec.changes.length - 1; i >= 0; i--) {
						const { from, to, insert } = spec.changes[i]!;
						this.value =
							this.value.slice(0, from) +
							insert +
							this.value.slice(to);
					}
				},
			};
		}
	}

	getValue(): string {
		return this.value;
	}

	setValue(value: string): void {
		this.setValueCalls++;
		this.value = value;
	}

	getLine(line: number): string {
		return this.value.split("\n")[line] ?? "";
	}

	lastLine(): number {
		return this.value.split("\n").length - 1;
	}

	setSelection(): void {
		this.selectionCalls++;
	}

	scrollTo(left: number, top: number): void {
		this.scrolledTo.push({ left, top });
	}

	offsetToPos(offset: number): EditorPosition {
		const lines = this.value.slice(0, offset).split("\n");
		return {
			line: lines.length - 1,
			ch: (lines[lines.length - 1] ?? "").length,
		};
	}

	posToOffset(pos: EditorPosition): number {
		const lines = this.value.split("\n");
		let offset = 0;
		for (let i = 0; i < pos.line; i++) {
			offset += (lines[i] ?? "").length + 1;
		}
		return offset + pos.ch;
	}

	replaceRange(
		insert: string,
		from: EditorPosition,
		to: EditorPosition,
	): void {
		this.replacedRanges.push({ insert, from, to });
		this.value =
			this.value.slice(0, this.posToOffset(from)) +
			insert +
			this.value.slice(this.posToOffset(to));
	}

	asEditor(): Editor {
		return this as unknown as Editor;
	}
}

describe("diffRange", () => {
	test("identical text produces no change", () => {
		expect(diffRange("same text", "same text")).toBeNull();
	});

	test("change at the start", () => {
		expect(diffRange("[a](http://a) tail", "a tail")).toEqual({
			from: 0,
			to: 13,
			insert: "a",
		});
	});

	test("change in the middle", () => {
		expect(diffRange("head [a](http://a) tail", "head a tail")).toEqual({
			from: 5,
			to: 18,
			insert: "a",
		});
	});

	test("change at the end", () => {
		expect(diffRange("head [a](http://a)", "head a")).toEqual({
			from: 5,
			to: 18,
			insert: "a",
		});
	});

	test("pure deletion leaves an empty insert", () => {
		expect(diffRange("keep [[gone]] keep", "keep  keep")).toEqual({
			from: 5,
			to: 13,
			insert: "",
		});
	});

	test("everything removed", () => {
		expect(diffRange("[[gone]]", "")).toEqual({
			from: 0,
			to: 8,
			insert: "",
		});
	});

	test("prefix and suffix do not overlap on repeated text", () => {
		const diff = diffRange("aaaa", "aa");
		expect(diff).not.toBeNull();
		const { from, to, insert } = diff!;
		expect(from).toBeLessThanOrEqual(to);
		expect("aaaa".slice(0, from) + insert + "aaaa".slice(to)).toBe("aa");
	});
});

describe("diffChanges", () => {
	test("identical text produces no changes", () => {
		expect(diffChanges("same\ntext", "same\ntext")).toEqual([]);
	});

	test("scattered links become separate per-line changes, not one wide span", () => {
		const oldText =
			"[a](http://a) top\nuntouched middle\nbottom [b](http://b)";
		const newText = "a top\nuntouched middle\nbottom b";

		expect(diffChanges(oldText, newText)).toEqual([
			{ from: 0, to: 13, insert: "a" },
			{ from: 42, to: 55, insert: "b" },
		]);
	});

	test("change confined to one line touches only that line", () => {
		const oldText = "one\ntwo [[link]]\nthree";
		const newText = "one\ntwo link\nthree";

		expect(diffChanges(oldText, newText)).toEqual([
			{ from: 8, to: 16, insert: "link" },
		]);
	});

	test("differing line counts fall back to one change over the modified block", () => {
		const oldText = "keep\ngone\nalso gone\nkeep";
		const newText = "keep\nmerged\nkeep";

		const changes = diffChanges(oldText, newText);
		expect(changes).toHaveLength(1);
		const { from, to, insert } = changes[0]!;
		expect(oldText.slice(0, from) + insert + oldText.slice(to)).toBe(
			newText,
		);
	});

	test("every change replays onto the old text to produce the new text", () => {
		const oldText =
			"# Head\n[x](http://x) and [y](http://y)\nplain\n![[embed.png]]\ntail";
		const newText = "# Head\nx and y\nplain\n\ntail";

		const changes = diffChanges(oldText, newText);
		let result = oldText;
		for (let i = changes.length - 1; i >= 0; i--) {
			const { from, to, insert } = changes[i]!;
			result = result.slice(0, from) + insert + result.slice(to);
		}
		expect(result).toBe(newText);
	});
});

describe("applyTextUpdate", () => {
	const linked = "line [one](http://one)\nuntouched\nline [three](http://three)";
	const unlinked = "line one\nuntouched\nline three";

	test("returns false and touches nothing when content is unchanged", () => {
		const editor = new StubEditor("no links here");

		expect(applyTextUpdate(editor.asEditor(), "no links here")).toBe(false);
		expect(editor.dispatched).toHaveLength(0);
		expect(editor.replacedRanges).toHaveLength(0);
		expect(editor.setValueCalls).toBe(0);
	});

	test("dispatches per-line changes through the CodeMirror view", () => {
		const editor = new StubEditor(linked);

		expect(applyTextUpdate(editor.asEditor(), unlinked)).toBe(true);
		expect(editor.dispatched).toEqual([
			{
				changes: [
					{ from: 5, to: 22, insert: "one" },
					{ from: 38, to: 59, insert: "three" },
				],
			},
		]);
		expect(editor.value).toBe(unlinked);
		expect(editor.replacedRanges).toHaveLength(0);
	});

	test("falls back to replaceRange when the editor exposes no CodeMirror view", () => {
		const editor = new StubEditor(linked, { cm: false });

		expect(applyTextUpdate(editor.asEditor(), unlinked)).toBe(true);
		expect(editor.value).toBe(unlinked);
		expect(editor.replacedRanges).toEqual([
			{
				insert: "three",
				from: { line: 2, ch: 5 },
				to: { line: 2, ch: 26 },
			},
			{
				insert: "one",
				from: { line: 0, ch: 5 },
				to: { line: 0, ch: 22 },
			},
		]);
	});

	test.each([
		["with a CodeMirror view", true],
		["without a CodeMirror view", false],
	])("never moves the cursor or the scroll position %s", (_name, hasCm) => {
		const editor = new StubEditor(linked, { cm: hasCm });

		applyTextUpdate(editor.asEditor(), unlinked);

		expect(editor.setValueCalls).toBe(0);
		expect(editor.selectionCalls).toBe(0);
		expect(editor.scrolledTo).toHaveLength(0);
	});
});
