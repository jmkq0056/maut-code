/*---------------------------------------------------------------------------------------------
 *  Maut: open a single terminal in the editor area running `clsp`, with EDITOR/VISUAL set so
 *  Claude Code's external-editor command opens files in this Maut code window. Also provides
 *  a terminal link handler for `[Image #N]` references coming out of Claude Code.
 *--------------------------------------------------------------------------------------------*/

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';

const IMAGE_CACHE_ROOT = path.join(os.homedir(), '.claude', 'image-cache');
const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];
const CLSP_COMMAND = 'clsp';

function getActiveSessionDir(): string | undefined {
	try {
		if (!fs.existsSync(IMAGE_CACHE_ROOT)) {
			return undefined;
		}
		const entries = fs.readdirSync(IMAGE_CACHE_ROOT, { withFileTypes: true });
		let best: { name: string; mtime: number } | undefined;
		for (const e of entries) {
			if (!e.isDirectory()) {
				continue;
			}
			const full = path.join(IMAGE_CACHE_ROOT, e.name);
			try {
				const st = fs.statSync(full);
				if (!best || st.mtimeMs > best.mtime) {
					best = { name: e.name, mtime: st.mtimeMs };
				}
			} catch { /* skip */ }
		}
		return best ? path.join(IMAGE_CACHE_ROOT, best.name) : undefined;
	} catch {
		return undefined;
	}
}

function resolveImageByIndex(session: string | undefined, n: number): vscode.Uri | undefined {
	if (!session) { return undefined; }
	for (const ext of IMAGE_EXTS) {
		const candidate = path.join(session, `${n}${ext}`);
		if (fs.existsSync(candidate)) {
			return vscode.Uri.file(candidate);
		}
	}
	return undefined;
}

class ClaudeImageTerminalLinkProvider implements vscode.TerminalLinkProvider<vscode.TerminalLink & { imageIndex: number }> {

	provideTerminalLinks(context: vscode.TerminalLinkContext): (vscode.TerminalLink & { imageIndex: number })[] {
		const links: (vscode.TerminalLink & { imageIndex: number })[] = [];
		const re = /\[Image #(\d+)\]/g;
		let m: RegExpExecArray | null;
		const session = getActiveSessionDir();
		while ((m = re.exec(context.line)) !== null) {
			const n = parseInt(m[1], 10);
			const uri = resolveImageByIndex(session, n);
			let tooltip: string;
			if (uri) {
				// vscode-file:// is VS Code's blessed scheme for local file access from trusted
				// markdown — no base64 bloat, works for any image size.
				const vscodeFileUri = `vscode-file://vscode-app${uri.fsPath.split('/').map(s => encodeURIComponent(s)).join('/')}`;
				tooltip = `mautImg:![preview](${vscodeFileUri}|width=480)\n\n**Image #${n}** · ${path.basename(uri.fsPath)}\n\ncmd + click to open in editor`;
			} else {
				tooltip = `Image #${n} not found in current session`;
			}
			links.push({
				startIndex: m.index,
				length: m[0].length,
				tooltip,
				imageIndex: n,
			});
		}
		return links;
	}

	async handleTerminalLink(link: vscode.TerminalLink & { imageIndex: number }): Promise<void> {
		const session = getActiveSessionDir();
		const uri = resolveImageByIndex(session, link.imageIndex);
		if (!uri) {
			vscode.window.showWarningMessage(`Image #${link.imageIndex} not found in active Claude session.`);
			return;
		}
		await vscode.commands.executeCommand('vscode.open', uri);
	}
}

let mautTerminal: vscode.Terminal | undefined;
let claudeCounter = 0;

interface MautTerminalInfo {
	readonly number: number;
	state: 'active' | 'idle';
	icon: string;
	color: string;
}

const ICON_POOL = [
	'flame', 'rocket', 'star-empty', 'beaker', 'lightbulb', 'mortar-board',
	'snake', 'octoface', 'bug', 'gear', 'plug', 'briefcase', 'bell', 'book',
	'calendar', 'compass', 'dashboard', 'database', 'archive', 'diff',
];

const COLOR_POOL = [
	'terminal.ansiBlue', 'terminal.ansiCyan', 'terminal.ansiGreen', 'terminal.ansiMagenta',
	'terminal.ansiRed', 'terminal.ansiYellow',
	'terminal.ansiBrightBlue', 'terminal.ansiBrightCyan', 'terminal.ansiBrightGreen',
	'terminal.ansiBrightMagenta', 'terminal.ansiBrightRed', 'terminal.ansiBrightYellow',
];

const usedIcons = new Map<string, number>(); // icon → refcount
const usedColors = new Map<string, number>();

function allocateIcon(): string {
	for (const ic of ICON_POOL) {
		if (!usedIcons.has(ic)) { usedIcons.set(ic, 1); return ic; }
	}
	// All taken; pick least-used.
	let min: { id: string; count: number } | undefined;
	for (const [id, count] of usedIcons) {
		if (!min || count < min.count) { min = { id, count }; }
	}
	const id = min?.id ?? ICON_POOL[0];
	usedIcons.set(id, (usedIcons.get(id) ?? 0) + 1);
	return id;
}

function allocateColor(): string {
	for (const c of COLOR_POOL) {
		if (!usedColors.has(c)) { usedColors.set(c, 1); return c; }
	}
	let min: { id: string; count: number } | undefined;
	for (const [id, count] of usedColors) {
		if (!min || count < min.count) { min = { id, count }; }
	}
	const id = min?.id ?? COLOR_POOL[0];
	usedColors.set(id, (usedColors.get(id) ?? 0) + 1);
	return id;
}

function releaseAllocation(info: MautTerminalInfo): void {
	const ic = usedIcons.get(info.icon);
	if (ic !== undefined) {
		if (ic <= 1) { usedIcons.delete(info.icon); } else { usedIcons.set(info.icon, ic - 1); }
	}
	const co = usedColors.get(info.color);
	if (co !== undefined) {
		if (co <= 1) { usedColors.delete(info.color); } else { usedColors.set(info.color, co - 1); }
	}
}

const mautTerminals = new Map<vscode.Terminal, MautTerminalInfo>();

function isClaudeCommand(cmd: string): boolean {
	const trimmed = cmd.trim();
	return /^(clsp|claude)(\s|$)/.test(trimmed);
}

function nextNumber(): number {
	claudeCounter++;
	return claudeCounter;
}

function makeMautName(n: number): string {
	return `${n} -- MAUT`;
}

function startClaudeInNewTerminal(): vscode.Terminal {
	const n = nextNumber();
	const icon = allocateIcon();
	const color = allocateColor();
	const t = vscode.window.createTerminal({
		name: makeMautName(n),
		iconPath: new vscode.ThemeIcon(icon),
		color: new vscode.ThemeColor(color),
		env: {
			EDITOR: 'maut-code --wait',
			VISUAL: 'maut-code --wait',
		},
	});
	mautTerminals.set(t, { number: n, state: 'active', icon, color });
	t.show(false);
	t.sendText(CLSP_COMMAND, true);
	mautTerminal = t;
	return t;
}

function mautInfo(t: vscode.Terminal): MautTerminalInfo | undefined {
	return mautTerminals.get(t);
}

function labelFor(t: vscode.Terminal): string {
	const info = mautInfo(t);
	if (!info) { return t.name; }
	return makeMautName(info.number);
}

async function switchMautTerminal(): Promise<void> {
	const entries: vscode.QuickPickItem[] = [];
	const sorted = Array.from(mautTerminals.entries()).sort((a, b) => a[1].number - b[1].number);
	for (const [, info] of sorted) {
		entries.push({
			label: `${info.state === 'active' ? '$(circle-filled)' : '$(circle-outline)'} ${makeMautName(info.number)}`,
			description: info.state === 'active' ? 'active' : 'idle',
		});
	}
	entries.push({ label: '$(add) Start new MAUT', description: 'spawn a fresh numbered terminal' });
	const pick = await vscode.window.showQuickPick(entries, { placeHolder: 'Switch Maut terminal' });
	if (!pick) { return; }
	if (pick.label.startsWith('$(add)')) {
		startClaudeInNewTerminal();
		return;
	}
	const m = /(\d+) -- MAUT/.exec(pick.label);
	if (!m) { return; }
	const target = sorted.find(([, info]) => info.number === parseInt(m[1], 10));
	if (target) {
		target[0].show(false);
		mautTerminal = target[0];
	}
}

function bindShellExecutionTracking(context: vscode.ExtensionContext): void {
	const onStart = (vscode.window as any).onDidStartTerminalShellExecution as vscode.Event<{ terminal: vscode.Terminal; execution: { commandLine: { value: string } } }> | undefined;
	const onEnd = (vscode.window as any).onDidEndTerminalShellExecution as vscode.Event<{ terminal: vscode.Terminal; execution: { commandLine: { value: string } } }> | undefined;
	if (onStart) {
		context.subscriptions.push(onStart(async (e) => {
			const cmd = e.execution?.commandLine?.value ?? '';
			if (!isClaudeCommand(cmd)) { return; }
			let info = mautTerminals.get(e.terminal);
			if (!info) {
				// brand-new adoption
				const n = nextNumber();
				const icon = allocateIcon();
				const color = allocateColor();
				info = { number: n, state: 'active', icon, color };
				mautTerminals.set(e.terminal, info);
				try {
					e.terminal.show(false);
					await vscode.commands.executeCommand('workbench.action.terminal.renameWithArg', { name: makeMautName(n) });
					await vscode.commands.executeCommand('maut.terminal.setAppearance', { icon, color });
				} catch { /* noop */ }
			} else if (info.state === 'idle') {
				// previously idle terminal — re-allocate fresh icon+color so it visibly becomes
				// a live Maut session again.
				const icon = allocateIcon();
				const color = allocateColor();
				info.icon = icon;
				info.color = color;
				info.state = 'active';
				try {
					e.terminal.show(false);
					await vscode.commands.executeCommand('maut.terminal.setAppearance', { icon, color });
				} catch { /* noop */ }
			} else {
				info.state = 'active';
			}
			mautTerminal = e.terminal;
		}));
	}
	if (onEnd) {
		context.subscriptions.push(onEnd(async (e) => {
			const cmd = e.execution?.commandLine?.value ?? '';
			if (!isClaudeCommand(cmd)) { return; }
			const info = mautTerminals.get(e.terminal);
			if (!info || info.state === 'idle') { return; }
			// Release the colorful slot back to the pool and mute the tab so the user can
			// see at a glance which terminals have a live claude vs. dormant scrollback.
			releaseAllocation(info);
			info.state = 'idle';
			info.icon = 'history';
			info.color = 'terminal.ansiBlack';
			try {
				e.terminal.show(false);
				await vscode.commands.executeCommand('maut.terminal.setAppearance', { icon: info.icon, color: info.color });
			} catch { /* noop */ }
		}));
	}
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	context.subscriptions.push(
		vscode.window.registerTerminalLinkProvider(new ClaudeImageTerminalLinkProvider()),
	);

	context.subscriptions.push(
		vscode.window.onDidCloseTerminal((t) => {
			const info = mautTerminals.get(t);
			if (info) { releaseAllocation(info); }
			mautTerminals.delete(t);
			if (t === mautTerminal) { mautTerminal = undefined; }
		}),
	);

	bindShellExecutionTracking(context);

	context.subscriptions.push(
		vscode.commands.registerCommand('maut.chat.startClaude', () => startClaudeInNewTerminal()),
		vscode.commands.registerCommand('maut.terminals.switch', () => switchMautTerminal()),
		vscode.commands.registerCommand('maut.terminals.label', (t: vscode.Terminal) => labelFor(t)),
	);

	// Move any editor-area terminals down into the bottom panel (like a drag-and-drop)
	// so they share the panel and free up editor area width.
	for (const t of vscode.window.terminals) {
		try {
			t.show(false);
			await vscode.commands.executeCommand('workbench.action.terminal.moveToTerminalPanel');
		} catch { /* noop */ }
	}

	// If no terminal exists yet, start clsp in the panel.
	if (vscode.window.terminals.length === 0) {
		startClaudeInNewTerminal();
	} else {
		// Reuse an existing Maut Claude terminal if there is one
		const existing = vscode.window.terminals.find(t => t.name.startsWith('Maut'));
		if (existing) {
			mautTerminal = existing;
			existing.show(false);
		}
	}
}

export function deactivate(): void { /* noop */ }
