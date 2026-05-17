/*---------------------------------------------------------------------------------------------
 *  Maut Markdown Preview-by-Default.
 *  When a .md file is opened, replace the source editor with the rendered preview.
 *  ⇧⌘V (or the editor-title button) toggles between preview and source.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

const recentlyOpened = new Set<string>();

function isMarkdownDoc(doc?: vscode.TextDocument): boolean {
	return !!doc && doc.languageId === 'markdown' && (doc.uri.scheme === 'file' || doc.uri.scheme === 'untitled');
}

async function openPreview(uri: vscode.Uri): Promise<void> {
	// `markdown.showPreview` reuses the active editor column; switch the source editor for the preview.
	await vscode.commands.executeCommand('markdown.showPreview', uri);
	// Close the source tab if it's still open in the active group.
	const all = vscode.window.tabGroups.all;
	for (const group of all) {
		for (const tab of group.tabs) {
			const input = tab.input as { uri?: vscode.Uri } | undefined;
			if (input?.uri?.toString() === uri.toString()) {
				try { await vscode.window.tabGroups.close(tab); } catch { /* noop */ }
			}
		}
	}
}

async function toggleSourcePreview(): Promise<void> {
	const editor = vscode.window.activeTextEditor;
	if (editor && editor.document.languageId === 'markdown') {
		// In source → switch to preview.
		const uri = editor.document.uri;
		await openPreview(uri);
		return;
	}
	// Else assume active is a preview → toggle back to source by opening the document.
	const previewTab = vscode.window.tabGroups.activeTabGroup.activeTab;
	const previewInput = previewTab?.input as { uri?: vscode.Uri; viewType?: string } | undefined;
	if (previewInput?.uri) {
		await vscode.window.showTextDocument(previewInput.uri, { preview: false });
		if (previewTab) { try { await vscode.window.tabGroups.close(previewTab); } catch { /* noop */ } }
	}
}

export function activate(context: vscode.ExtensionContext): void {
	context.subscriptions.push(
		vscode.commands.registerCommand('maut.markdown.toggle', toggleSourcePreview),
		vscode.workspace.onDidOpenTextDocument(async (doc) => {
			const cfg = vscode.workspace.getConfiguration('maut.markdown');
			if (!cfg.get<boolean>('previewByDefault', true)) { return; }
			if (!isMarkdownDoc(doc)) { return; }
			const key = doc.uri.toString();
			if (recentlyOpened.has(key)) { return; }
			recentlyOpened.add(key);
			setTimeout(() => recentlyOpened.delete(key), 1500);
			// Defer one tick so the source editor is fully open before we replace it.
			setTimeout(() => { void openPreview(doc.uri); }, 50);
		}),
	);
}

export function deactivate(): void { /* noop */ }
