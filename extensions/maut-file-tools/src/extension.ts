import * as vscode from 'vscode';
import { fileToTxt, fileToJson, officeToPdf } from './converters';
import { appendToMautCli } from './cliBridge';
import { openPdfPagePicker } from './pdfPagePicker';

function resolveUriArg(arg: unknown): vscode.Uri | undefined {
	if (arg instanceof vscode.Uri) { return arg; }
	if (typeof arg === 'object' && arg && 'fsPath' in (arg as Record<string, unknown>)) {
		return vscode.Uri.file(String((arg as { fsPath: unknown }).fsPath));
	}
	return vscode.window.activeTextEditor?.document.uri;
}

export function activate(context: vscode.ExtensionContext): void {
	context.subscriptions.push(
		vscode.commands.registerCommand('maut.fileTools.pickPdfPages', async (arg?: unknown) => {
			const uri = resolveUriArg(arg);
			if (!uri || uri.scheme !== 'file') { return; }
			await openPdfPagePicker(context.extensionUri, uri);
		}),
		vscode.commands.registerCommand('maut.fileTools.toTxt', async (arg?: unknown) => {
			const uri = resolveUriArg(arg);
			if (!uri || uri.scheme !== 'file') { return; }
			await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: `Maut · → TXT` }, async () => {
				const out = await fileToTxt(uri);
				if (out) { appendToMautCli([out]); }
			});
		}),
		vscode.commands.registerCommand('maut.fileTools.toJson', async (arg?: unknown) => {
			const uri = resolveUriArg(arg);
			if (!uri || uri.scheme !== 'file') { return; }
			await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: `Maut · → JSON` }, async () => {
				const out = await fileToJson(uri);
				if (out) { appendToMautCli([out]); }
			});
		}),
		vscode.commands.registerCommand('maut.fileTools.docxToPdf', async (arg?: unknown) => {
			const uri = resolveUriArg(arg);
			if (!uri || uri.scheme !== 'file') { return; }
			await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: `Maut · DOCX → PDF` }, async () => {
				const out = await officeToPdf(uri);
				if (out) { appendToMautCli([out]); }
			});
		}),
		vscode.commands.registerCommand('maut.fileTools.pptxToPdf', async (arg?: unknown) => {
			const uri = resolveUriArg(arg);
			if (!uri || uri.scheme !== 'file') { return; }
			await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: `Maut · PPTX → PDF` }, async () => {
				const out = await officeToPdf(uri);
				if (out) { appendToMautCli([out]); }
			});
		}),
	);
}

export function deactivate(): void { /* noop */ }
