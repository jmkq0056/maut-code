/*---------------------------------------------------------------------------------------------
 *  Maut code: global type-trigger.
 *  Anywhere in the workbench (editor, terminal, file search, command palette, prompts) —
 *  type the four letters `m`, `a`, `u`, `t` in quick succession with no modifiers, and Maut
 *  removes the typed letters (best-effort) and spawns a new clsp terminal.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';
import { IWorkbenchContribution, WorkbenchPhase, registerWorkbenchContribution2 } from '../../../common/contributions.js';
import { ITerminalService } from '../../terminal/browser/terminal.js';

const TRIGGER = 'maut';
const MAX_GAP_MS = 900;

class MautTypeTrigger extends Disposable implements IWorkbenchContribution {

	static readonly ID = 'workbench.contrib.mautcode.typeTrigger';

	private buffer: Array<{ ch: string; t: number }> = [];

	constructor(
		@ICommandService private readonly commandService: ICommandService,
		@ITerminalService private readonly terminalService: ITerminalService,
	) {
		super();
		const handler = (e: KeyboardEvent) => this.onKeyDown(e);
		// Use bubble phase so we don't pre-empt the keystroke before VS Code/Monaco renders it.
		document.addEventListener('keydown', handler, false);
		this._register({ dispose: () => document.removeEventListener('keydown', handler, false) });
	}

	private onKeyDown(e: KeyboardEvent): void {
		if (e.metaKey || e.ctrlKey || e.altKey) { this.buffer = []; return; }
		const ch = (e.key || '').toLowerCase();
		if (ch.length !== 1 || !/^[a-z]$/.test(ch)) { this.buffer = []; return; }
		const now = Date.now();
		if (this.buffer.length > 0 && now - this.buffer[this.buffer.length - 1].t > MAX_GAP_MS) {
			this.buffer = [];
		}
		this.buffer.push({ ch, t: now });
		if (this.buffer.length > TRIGGER.length) {
			this.buffer.shift();
		}
		if (this.buffer.length === TRIGGER.length && this.buffer.map(b => b.ch).join('') === TRIGGER) {
			this.buffer = [];
			void this.fire();
		}
	}

	private async fire(): Promise<void> {
		// Best-effort delete the four typed chars from whatever currently has focus.
		await this.removeTypedTrigger();
		// Spawn a Maut Claude terminal.
		try {
			await this.commandService.executeCommand('maut.chat.startClaude');
		} catch { /* extension may not be loaded yet — ignore */ }
	}

	private async removeTypedTrigger(): Promise<void> {
		// 1) If a terminal has focus, push 4 DEL bytes into its stdin.
		const activeTerminal = this.terminalService.activeInstance;
		if (activeTerminal && (document.activeElement?.closest('.xterm') || document.activeElement?.closest('.terminal-wrapper'))) {
			try { activeTerminal.sendText('\x7f\x7f\x7f\x7f', false); } catch { /* noop */ }
			return;
		}

		// 2) HTML input/textarea — directly clip the last 4 chars.
		const active = document.activeElement as HTMLElement | null;
		if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
			const end = active.selectionEnd ?? active.value.length;
			const start = Math.max(0, end - TRIGGER.length);
			if (start < end) {
				active.setRangeText('', start, end, 'end');
				active.dispatchEvent(new Event('input', { bubbles: true }));
			}
			return;
		}

		// 3) Monaco editor / contenteditable / quickpick input — best effort via deleteLeft.
		try {
			for (let i = 0; i < TRIGGER.length; i++) {
				await this.commandService.executeCommand('deleteLeft');
			}
		} catch { /* noop */ }
	}
}

registerWorkbenchContribution2(MautTypeTrigger.ID, MautTypeTrigger, WorkbenchPhase.AfterRestored);
