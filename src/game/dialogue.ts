/**
 * Dialogue as typed data, and a small runner that walks through it. A
 * dialogue picks its first node from `entry` (the first branch whose
 * condition holds), shows that node's lines, applies its effects, and then
 * either offers choices or moves on to `next`.
 */
import type { Expression } from '../sprites/characters/portraitKit';
import { applyAll, check, type Condition, type Effect } from './conditions';
import type { GameState } from './state';

export type SpeakerId = string;

export interface Line {
  /** Who is speaking. Omit for narration. */
  who?: SpeakerId;
  /** Portrait expression, for speakers with portraits. */
  expr?: Expression;
  text: string;
}

export interface Choice {
  text: string;
  if?: Condition;
  then?: Effect[];
  next?: string;
}

export interface DialogueNode {
  lines: Line[];
  /** Applied once every line of the node has been shown. */
  then?: Effect[];
  choices?: Choice[];
  next?: string;
}

export interface Dialogue {
  id: string;
  entry: { if?: Condition; node: string }[];
  nodes: Record<string, DialogueNode>;
}

/** What the UI should show right now. */
export interface DialogueView {
  line: Line;
  /** Choices to offer after this line, already filtered by their conditions. */
  choices: { text: string; index: number }[];
}

/** Replaces {name} with the Rookie's name. */
export function fillText(text: string, state: GameState): string {
  return text.replace(/\{name\}/g, state.rookieName);
}

export class DialogueRun {
  private node: DialogueNode | null = null;
  private lineIndex = 0;
  done = false;

  constructor(
    readonly dialogue: Dialogue,
    private readonly state: GameState,
  ) {
    const start = dialogue.entry.find((e) => check(e.if, state));
    if (!start) {
      this.done = true;
      return;
    }
    this.enter(start.node);
  }

  private enter(id: string | undefined): void {
    if (id === undefined) {
      this.done = true;
      this.node = null;
      return;
    }
    const node = this.dialogue.nodes[id];
    if (!node) throw new Error(`dialogue ${this.dialogue.id}: missing node ${id}`);
    this.node = node;
    this.lineIndex = 0;
    if (node.lines.length === 0) this.finishNode();
  }

  private visibleChoices(): { text: string; index: number }[] {
    const choices = this.node?.choices ?? [];
    return choices
      .map((c, index) => ({ c, index }))
      .filter(({ c }) => check(c.if, this.state))
      .map(({ c, index }) => ({ text: fillText(c.text, this.state), index }));
  }

  view(): DialogueView | null {
    if (this.done || !this.node) return null;
    const line = this.node.lines[this.lineIndex];
    if (!line) return null;
    const last = this.lineIndex === this.node.lines.length - 1;
    return {
      line: { ...line, text: fillText(line.text, this.state) },
      choices: last ? this.visibleChoices() : [],
    };
  }

  /** Moves past the current line. Ignored while choices are waiting. */
  advance(): void {
    if (this.done || !this.node) return;
    const last = this.lineIndex >= this.node.lines.length - 1;
    if (!last) {
      this.lineIndex++;
      return;
    }
    if (this.visibleChoices().length > 0) return;
    this.finishNode();
  }

  choose(index: number): void {
    if (this.done || !this.node) return;
    const choice = this.node.choices?.[index];
    if (!choice || !check(choice.if, this.state)) return;
    applyAll(this.node.then, this.state);
    applyAll(choice.then, this.state);
    this.enter(choice.next);
  }

  private finishNode(): void {
    const node = this.node;
    if (!node) return;
    applyAll(node.then, this.state);
    this.enter(node.next);
  }
}

/** Runs a dialogue to the end, picking choices by index, for tests and bots. */
export function playThrough(d: Dialogue, state: GameState, picks: number[] = []): string[] {
  const run = new DialogueRun(d, state);
  const seen: string[] = [];
  let guard = 0;
  while (!run.done && guard++ < 1000) {
    const v = run.view();
    if (!v) break;
    seen.push(v.line.text);
    if (v.choices.length > 0) {
      const pick = picks.shift() ?? 0;
      run.choose(v.choices[Math.min(pick, v.choices.length - 1)]?.index ?? 0);
    } else run.advance();
  }
  return seen;
}
