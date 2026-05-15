/*---------------------------------------------------------------------------------------------
 *  Maut Open External: file-type-aware right-click actions.
 *    - HTML/PDF/SVG  → Open in Firefox
 *    - DOCX/ODT/RTF  → Show in Word
 *    - XLSX/CSV/TSV  → Show in Excel
 *    - PPTX/ODP      → Show in PowerPoint
 *    - SH/BASH/ZSH   → Execute Script in Terminal
 *    - anything      → Open With System Default App
 *--------------------------------------------------------------------------------------------*/

import { spawn } from 'child_process';
import * as vscode from 'vscode';

async function resolveTarget(arg: unknown): Promise<vscode.Uri | undefined> {
	if (arg instanceof vscode.Uri) { return arg; }
	if (typeof arg === 'object' && arg && 'fsPath' in (arg as Record<string, unknown>)) {
		const fsPath = String((arg as { fsPath: unknown }).fsPath ?? '');
		if (fsPath) { return vscode.Uri.file(fsPath); }
	}
	const editor = vscode.window.activeTextEditor;
	if (editor) { return editor.document.uri; }
	return undefined;
}

async function openWith(appName: string | undefined, arg: unknown): Promise<void> {
	const uri = await resolveTarget(arg);
	if (!uri || uri.scheme !== 'file') {
		vscode.window.showWarningMessage('Maut: Could not resolve a local file path to open.');
		return;
	}
	const args = appName ? ['-a', appName, uri.fsPath] : [uri.fsPath];
	try {
		const child = spawn('open', args, { detached: true, stdio: 'ignore' });
		child.on('error', (err) => {
			vscode.window.showErrorMessage(`Failed to launch ${appName ?? 'default app'}: ${err.message}`);
		});
		child.unref();
	} catch (err) {
		vscode.window.showErrorMessage(`Failed to launch ${appName ?? 'default app'}: ${err}`);
	}
}

function shellQuote(s: string): string {
	return s.includes(' ') || /[$`"\\']/.test(s) ? `'${s.replace(/'/g, `'\\''`)}'` : s;
}

async function runScript(arg: unknown): Promise<void> {
	const uri = await resolveTarget(arg);
	if (!uri || uri.scheme !== 'file') {
		vscode.window.showWarningMessage('Maut: Could not resolve a local script path to run.');
		return;
	}
	const terminal = vscode.window.activeTerminal ?? vscode.window.createTerminal({ name: 'Maut · run' });
	terminal.show(true);
	terminal.sendText(`bash ${shellQuote(uri.fsPath)}`, true);
}

async function compileTexAndOpenInFirefox(arg: unknown): Promise<void> {
	const uri = await resolveTarget(arg);
	if (!uri || uri.scheme !== 'file' || !uri.fsPath.endsWith('.tex')) {
		vscode.window.showWarningMessage('Maut: select a .tex file first.');
		return;
	}
	const path = await import('node:path');
	const dir = path.dirname(uri.fsPath);
	const file = path.basename(uri.fsPath);
	const base = path.basename(uri.fsPath, '.tex');

	const terminal = vscode.window.createTerminal({ name: `Maut · tex · ${base}`, cwd: dir });
	terminal.show(true);
	// Short single-line command operating in $PWD; `;` so each step runs even if pdflatex errors.
	const cmd = `pdflatex -interaction=nonstopmode ${shellQuote(file)}; pdflatex -interaction=nonstopmode ${shellQuote(file)}; rm -f ${shellQuote(base)}.{aux,log,out,toc,fdb_latexmk,fls,synctex.gz,nav,snm,bbl,blg}; open -a Firefox ${shellQuote(base + '.pdf')}`;
	terminal.sendText(cmd, true);
}

export function activate(context: vscode.ExtensionContext): void {
	context.subscriptions.push(
		vscode.commands.registerCommand('maut.openIn.firefox', (arg) => openWith('Firefox', arg)),
		vscode.commands.registerCommand('maut.openIn.word', (arg) => openWith('Microsoft Word', arg)),
		vscode.commands.registerCommand('maut.openIn.excel', (arg) => openWith('Microsoft Excel', arg)),
		vscode.commands.registerCommand('maut.openIn.powerpoint', (arg) => openWith('Microsoft PowerPoint', arg)),
		vscode.commands.registerCommand('maut.openIn.defaultApp', (arg) => openWith(undefined, arg)),
		vscode.commands.registerCommand('maut.run.script', (arg) => runScript(arg)),
		vscode.commands.registerCommand('maut.tex.compileAndOpenFirefox', (arg) => compileTexAndOpenInFirefox(arg)),
	);
}

export function deactivate(): void { /* noop */ }
