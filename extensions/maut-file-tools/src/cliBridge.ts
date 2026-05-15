import * as vscode from 'vscode';

export function findMautTerminal(): vscode.Terminal | undefined {
	const all = vscode.window.terminals;
	const maut = all.find(t => t.name.includes('MAUT') || t.name.startsWith('Maut'));
	return maut ?? vscode.window.activeTerminal;
}

export function appendToMautCli(absPaths: string[]): boolean {
	if (absPaths.length === 0) { return false; }
	const terminal = findMautTerminal();
	if (!terminal) {
		vscode.window.showWarningMessage('Maut: no terminal running. Start `clsp` first.');
		return false;
	}
	terminal.show(false);
	const mentions = absPaths.map(p => `@${p}`).join(' ') + ' ';
	terminal.sendText(mentions, false);
	return true;
}
