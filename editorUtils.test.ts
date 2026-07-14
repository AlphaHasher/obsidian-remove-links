import { describe, expect, test } from "@jest/globals";
import type { Editor, EditorPosition } from "obsidian";

import { applyTextUpdate, diffRange } from "./editorUtils";

/**
 * Minimal Obsidian Editor, covering only the methods
 * applyTextUpdate touches. Records the calls the tests assert on.
 */
class StubEditor {
	value: string;
	anchor: EditorPosition;
	head: EditorPosition;
	scroll = { top: 420, left: 7 };
	replacedRanges: {
		insert: string;
		from: EditorPosition;
		to: EditorPosition;
	}[] = [];
	scrolledTo: { left: number; top: number }[] = [];
	setValueCalls = 0;

	constructor(value: string, cursor: EditorPosition = { line: 0, ch: 0 }) {
		this.value = value;
		this.anchor = cursor;
		this.head = cursor;
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

	getCursor(mode: "anchor" | "head"): EditorPosition {
		return mode === "anchor" ? this.anchor : this.head;
	}

	setSelection(anchor: EditorPosition, head: EditorPosition): void {
		this.anchor = anchor;
		this.head = head;
	}

	getScrollInfo(): { top: number; left: number } {
		return this.scroll;
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

describe("applyTextUpdate", () => {
	test("returns false and touches nothing when content is unchanged", () => {
		const editor = new StubEditor("no links here");

		expect(applyTextUpdate(editor.asEditor(), "no links here")).toBe(false);
		expect(editor.replacedRanges).toHaveLength(0);
		expect(editor.scrolledTo).toHaveLength(0);
		expect(editor.setValueCalls).toBe(0);
	});

	test("replaces only the changed span and never calls setValue", () => {
		const editor = new StubEditor(
			"line one\nline [two](http://two)\nline three",
		);

		expect(
			applyTextUpdate(
				editor.asEditor(),
				"line one\nline two\nline three",
			),
		).toBe(true);
		expect(editor.value).toBe("line one\nline two\nline three");
		expect(editor.setValueCalls).toBe(0);
		expect(editor.replacedRanges).toEqual([
			{
				insert: "two",
				from: { line: 1, ch: 5 },
				to: { line: 1, ch: 22 },
			},
		]);
	});

	test("restores the cursor and the scroll position", () => {
		const editor = new StubEditor(
			"line one\nline [two](http://two)\nline three",
			{ line: 2, ch: 4 },
		);

		applyTextUpdate(editor.asEditor(), "line one\nline two\nline three");

		expect(editor.head).toEqual({ line: 2, ch: 4 });
		expect(editor.anchor).toEqual({ line: 2, ch: 4 });
		expect(editor.scrolledTo).toEqual([{ left: 7, top: 420 }]);
	});

	test("clamps a cursor that the edit pushed past the end of its line", () => {
		const editor = new StubEditor("line [two](http://two)", {
			line: 0,
			ch: 22,
		});

		applyTextUpdate(editor.asEditor(), "line two");

		expect(editor.head).toEqual({ line: 0, ch: 8 });
	});
});
