/*---------------------------------------------------------------------------------------------
 *  Maut Themes: ⇧⌘L flips between Maut Dark and Maut Light. Writes to user settings.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

const DARK: Record<string, string> = {
	'focusBorder': '#c62a47',
	'foreground': '#f0f0f8',
	'descriptionForeground': '#a8a8bb',
	'errorForeground': '#e8465f',
	'selection.background': '#c62a4755',
	'editor.background': '#0c0c14',
	'editor.foreground': '#f0f0f8',
	'editor.selectionBackground': '#c62a4744',
	'editor.lineHighlightBackground': '#1a1a2e',
	'editorCursor.foreground': '#c62a47',
	'editorLineNumber.foreground': '#4a4a6a',
	'editorLineNumber.activeForeground': '#e8465f',
	'editorGroupHeader.tabsBackground': '#0c0c14',
	'tab.activeBackground': '#1a1a2e',
	'tab.inactiveBackground': '#0c0c14',
	'tab.activeForeground': '#f0f0f8',
	'tab.inactiveForeground': '#6868a0',
	'tab.activeBorderTop': '#c62a47',
	'titleBar.activeBackground': '#0c0c14',
	'titleBar.activeForeground': '#f0f0f8',
	'activityBar.background': '#0c0c14',
	'activityBar.foreground': '#f0f0f8',
	'activityBar.activeBorder': '#c62a47',
	'activityBarBadge.background': '#c62a47',
	'activityBarBadge.foreground': '#f0f0f8',
	'sideBar.background': '#0c0c14',
	'sideBar.foreground': '#a8a8bb',
	'panel.background': '#0c0c14',
	'panelTitle.activeBorder': '#c62a47',
	'statusBar.background': '#0c0c14',
	'statusBar.foreground': '#a8a8bb',
	'terminal.background': '#0c0c14',
	'terminal.foreground': '#f0f0f8',
	'button.background': '#c62a47',
	'button.foreground': '#f0f0f8',
	'button.hoverBackground': '#e8465f',
	'input.background': '#101020',
	'input.foreground': '#f0f0f8',
	'list.activeSelectionBackground': '#1a1a2e',
	'list.activeSelectionForeground': '#e8465f',
	'list.hoverBackground': '#101020',
	'menu.background': '#101020',
	'menu.foreground': '#f0f0f8',
	'menu.selectionBackground': '#c62a47',
	'menu.selectionForeground': '#ffffff',
	'menubar.selectionBackground': '#c62a47',
	'menubar.selectionForeground': '#ffffff',
	'quickInputList.focusBackground': '#c62a47',
	'quickInputList.focusForeground': '#ffffff',
	'badge.background': '#c62a47',
	'badge.foreground': '#f0f0f8',
};

const LIGHT: Record<string, string> = {
	'focusBorder': '#c62a47',
	'foreground': '#1a1a2e',
	'descriptionForeground': '#6868a0',
	'errorForeground': '#c62a47',
	'selection.background': '#c62a4733',
	'editor.background': '#fafaf5',
	'editor.foreground': '#1a1a2e',
	'editor.selectionBackground': '#c62a4733',
	'editor.lineHighlightBackground': '#f0eee8',
	'editorCursor.foreground': '#c62a47',
	'editorLineNumber.foreground': '#9090a8',
	'editorLineNumber.activeForeground': '#c62a47',
	'editorGroupHeader.tabsBackground': '#fafaf5',
	'tab.activeBackground': '#ffffff',
	'tab.inactiveBackground': '#f0eee8',
	'tab.activeForeground': '#1a1a2e',
	'tab.inactiveForeground': '#6868a0',
	'tab.activeBorderTop': '#c62a47',
	'titleBar.activeBackground': '#fafaf5',
	'titleBar.activeForeground': '#1a1a2e',
	'activityBar.background': '#fafaf5',
	'activityBar.foreground': '#1a1a2e',
	'activityBar.activeBorder': '#c62a47',
	'activityBarBadge.background': '#c62a47',
	'activityBarBadge.foreground': '#ffffff',
	'sideBar.background': '#fafaf5',
	'sideBar.foreground': '#1a1a2e',
	'panel.background': '#fafaf5',
	'panelTitle.activeBorder': '#c62a47',
	'statusBar.background': '#fafaf5',
	'statusBar.foreground': '#1a1a2e',
	'terminal.background': '#fafaf5',
	'terminal.foreground': '#1a1a2e',
	'button.background': '#c62a47',
	'button.foreground': '#ffffff',
	'button.hoverBackground': '#e8465f',
	'input.background': '#ffffff',
	'input.foreground': '#1a1a2e',
	'list.activeSelectionBackground': '#c62a47',
	'list.activeSelectionForeground': '#ffffff',
	'list.hoverBackground': '#f0eee8',
	'menu.background': '#ffffff',
	'menu.foreground': '#1a1a2e',
	'menu.selectionBackground': '#c62a47',
	'menu.selectionForeground': '#ffffff',
	'menubar.selectionBackground': '#c62a47',
	'menubar.selectionForeground': '#ffffff',
	'quickInputList.focusBackground': '#c62a47',
	'quickInputList.focusForeground': '#ffffff',
	'badge.background': '#c62a47',
	'badge.foreground': '#ffffff',
};

async function toggleTheme(): Promise<void> {
	const cfg = vscode.workspace.getConfiguration();
	const current = cfg.get<string>('workbench.colorTheme', 'Default Dark Modern');
	const goingLight = !/Light/i.test(current);
	const next = goingLight ? 'Default Light Modern' : 'Default Dark Modern';
	const colors = goingLight ? LIGHT : DARK;
	await cfg.update('workbench.colorTheme', next, vscode.ConfigurationTarget.Global);
	await cfg.update('workbench.colorCustomizations', colors, vscode.ConfigurationTarget.Global);
	vscode.window.setStatusBarMessage(`Maut · ${goingLight ? 'Light' : 'Dark'}`, 2000);
}

export function activate(context: vscode.ExtensionContext): void {
	context.subscriptions.push(vscode.commands.registerCommand('maut.theme.toggle', toggleTheme));
}

export function deactivate(): void { /* noop */ }
