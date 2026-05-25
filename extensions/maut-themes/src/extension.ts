/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/*
 *  Maut Theme Studio: visual theme/font customiser.
 *
 *    - Status bar entry  ($(symbol-color)  Theme)  opens a webview panel.
 *    - The panel lets the user pick a mode (light/dark), an accent colour,
 *      a surface tint, a font and a font size. Every change writes to user
 *      settings immediately so the change is visible without re-opening the
 *      window.
 *    - 5 hand-tuned presets are shipped and applied with a single click.
 *    - Named user themes can be saved, recalled and deleted, and exported /
 *      imported as JSON.
 *    - The legacy  maut.theme.toggle  command (Shift+Cmd+L) is preserved.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

type Mode = 'dark' | 'light';

interface Snapshot {
	mode: Mode;
	accent: string;
	tint: string;
	fontFamily: string;
	fontSize: number;
}

interface NamedSnapshot extends Snapshot {
	name: string;
}

const DEFAULT_DARK: Snapshot = {
	mode: 'dark',
	accent: '#c62a47',
	tint: '#2a181c',
	fontFamily: 'JetBrains Mono, Menlo, Monaco, monospace',
	fontSize: 13,
};

const DEFAULT_LIGHT: Snapshot = {
	mode: 'light',
	accent: '#c62a47',
	tint: '#fafaf5',
	fontFamily: 'JetBrains Mono, Menlo, Monaco, monospace',
	fontSize: 13,
};

const PRESETS: NamedSnapshot[] = [
	{ name: 'Crimson dark', mode: 'dark', accent: '#c62a47', tint: '#2a181c', fontFamily: DEFAULT_DARK.fontFamily, fontSize: 13 },
	{ name: 'Midnight blue', mode: 'dark', accent: '#5b8def', tint: '#161b22', fontFamily: DEFAULT_DARK.fontFamily, fontSize: 13 },
	{ name: 'Forest', mode: 'dark', accent: '#8ac926', tint: '#1a1f1a', fontFamily: DEFAULT_DARK.fontFamily, fontSize: 13 },
	{ name: 'Sand light', mode: 'light', accent: '#b6541f', tint: '#faf6ef', fontFamily: DEFAULT_LIGHT.fontFamily, fontSize: 13 },
	{ name: 'Paper light', mode: 'light', accent: '#1a73e8', tint: '#fdfdfd', fontFamily: DEFAULT_LIGHT.fontFamily, fontSize: 13 },
];

function clamp(n: number, lo: number, hi: number): number {
	return Math.max(lo, Math.min(hi, n));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
	const m = /^#?([a-f\d]{6})$/i.exec(hex.trim());
	if (!m) {
		return { r: 198, g: 42, b: 71 };
	}
	const n = parseInt(m[1], 16);
	return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

function rgbToHex(r: number, g: number, b: number): string {
	const h = (v: number) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
	return `#${h(r)}${h(g)}${h(b)}`;
}

function withAlpha(hex: string, alpha: number): string {
	const a = clamp(Math.round(alpha * 255), 0, 255).toString(16).padStart(2, '0');
	return `${hex}${a}`;
}

function mix(a: string, b: string, t: number): string {
	const ra = hexToRgb(a);
	const rb = hexToRgb(b);
	return rgbToHex(
		ra.r + (rb.r - ra.r) * t,
		ra.g + (rb.g - ra.g) * t,
		ra.b + (rb.b - ra.b) * t,
	);
}

function lighten(hex: string, amount: number): string {
	return mix(hex, '#ffffff', amount);
}

function darken(hex: string, amount: number): string {
	return mix(hex, '#000000', amount);
}

function buildPalette(snap: Snapshot): Record<string, string> {
	const isLight = snap.mode === 'light';
	const accent = snap.accent;
	const accentHover = isLight ? darken(accent, 0.10) : lighten(accent, 0.10);

	const base = snap.tint;
	const chrome = isLight ? darken(base, 0.045) : lighten(base, 0.035);
	const chromeHi = isLight ? darken(base, 0.085) : lighten(base, 0.065);
	const surface = isLight ? darken(base, 0.025) : lighten(base, 0.04);
	const surfaceHi = isLight ? darken(base, 0.06) : lighten(base, 0.08);
	const border = isLight ? darken(base, 0.10) : lighten(base, 0.10);

	const fg = isLight ? '#1e1e22' : '#f0f0f8';
	const fgMuted = isLight ? '#5a5a6a' : '#a8a8bb';
	const fgSubtle = isLight ? '#8a8a98' : '#6868a0';
	const inputBg = isLight ? '#ffffff' : darken(base, 0.04);

	return {
		'focusBorder': accent,
		'foreground': fg,
		'descriptionForeground': fgMuted,
		'errorForeground': isLight ? '#c62a47' : '#e8465f',
		'selection.background': withAlpha(accent, 0.33),
		'contrastBorder': isLight ? withAlpha('#000000', 0.06) : withAlpha('#ffffff', 0.06),

		'editor.background': base,
		'editor.foreground': fg,
		'editor.selectionBackground': withAlpha(accent, 0.28),
		'editor.selectionHighlightBackground': withAlpha(accent, 0.14),
		'editor.findMatchBackground': withAlpha(accent, 0.30),
		'editor.findMatchHighlightBackground': withAlpha(accent, 0.18),
		'editor.lineHighlightBackground': surface,
		'editor.lineHighlightBorder': '#00000000',
		'editorCursor.foreground': accent,
		'editorLineNumber.foreground': fgSubtle,
		'editorLineNumber.activeForeground': accent,
		'editorIndentGuide.background1': isLight ? darken(base, 0.05) : lighten(base, 0.05),
		'editorIndentGuide.activeBackground1': isLight ? darken(base, 0.12) : lighten(base, 0.12),
		'editorWidget.background': surface,
		'editorWidget.border': border,
		'editorHoverWidget.background': surface,
		'editorHoverWidget.border': border,
		'editorSuggestWidget.background': surface,
		'editorSuggestWidget.border': border,
		'editorSuggestWidget.selectedBackground': withAlpha(accent, 0.25),
		'editorBracketMatch.background': withAlpha(accent, 0.15),
		'editorBracketMatch.border': withAlpha(accent, 0.40),

		'editorGroupHeader.tabsBackground': chrome,
		'editorGroupHeader.tabsBorder': border,
		'editorGroupHeader.border': border,
		'tab.activeBackground': base,
		'tab.inactiveBackground': chrome,
		'tab.activeForeground': fg,
		'tab.inactiveForeground': fgMuted,
		'tab.activeBorderTop': accent,
		'tab.activeBorder': '#00000000',
		'tab.border': border,
		'tab.hoverBackground': isLight ? lighten(chrome, 0.03) : darken(chrome, 0.03),

		'titleBar.activeBackground': chrome,
		'titleBar.activeForeground': fg,
		'titleBar.inactiveBackground': chrome,
		'titleBar.inactiveForeground': fgMuted,
		'titleBar.border': border,

		'activityBar.background': chrome,
		'activityBar.foreground': fg,
		'activityBar.inactiveForeground': fgSubtle,
		'activityBar.activeBorder': accent,
		'activityBar.border': border,
		'activityBarBadge.background': accent,
		'activityBarBadge.foreground': '#ffffff',

		'sideBar.background': chrome,
		'sideBar.foreground': fgMuted,
		'sideBar.border': border,
		'sideBarSectionHeader.background': chromeHi,
		'sideBarSectionHeader.foreground': fg,
		'sideBarSectionHeader.border': border,
		'sideBarTitle.foreground': fg,

		'panel.background': chrome,
		'panel.border': border,
		'panelTitle.activeBorder': accent,
		'panelTitle.activeForeground': fg,
		'panelTitle.inactiveForeground': fgMuted,
		'panelInput.border': border,

		'statusBar.background': chrome,
		'statusBar.foreground': fgMuted,
		'statusBar.border': border,
		'statusBar.noFolderBackground': chrome,
		'statusBar.debuggingBackground': accent,
		'statusBar.debuggingForeground': '#ffffff',
		'statusBarItem.hoverBackground': isLight ? withAlpha('#000000', 0.06) : withAlpha('#ffffff', 0.08),
		'statusBarItem.remoteBackground': accent,
		'statusBarItem.remoteForeground': '#ffffff',
		'statusBarItem.prominentBackground': withAlpha(accent, 0.18),
		'statusBarItem.prominentForeground': fg,

		'terminal.background': base,
		'terminal.foreground': fg,
		'terminal.selectionBackground': withAlpha(accent, 0.28),
		'terminalCursor.foreground': accent,

		'button.background': accent,
		'button.foreground': '#ffffff',
		'button.hoverBackground': accentHover,
		'button.secondaryBackground': surface,
		'button.secondaryForeground': fg,
		'button.secondaryHoverBackground': surfaceHi,

		'input.background': inputBg,
		'input.foreground': fg,
		'input.border': border,
		'input.placeholderForeground': fgSubtle,
		'inputOption.activeBorder': accent,
		'inputOption.activeBackground': withAlpha(accent, 0.18),
		'inputOption.activeForeground': fg,
		'inputValidation.errorBackground': isLight ? '#ffeef0' : '#3a1a20',
		'inputValidation.errorBorder': isLight ? '#c62a47' : '#e8465f',

		'dropdown.background': inputBg,
		'dropdown.foreground': fg,
		'dropdown.border': border,
		'dropdown.listBackground': inputBg,

		'list.activeSelectionBackground': isLight ? withAlpha(accent, 0.16) : surface,
		'list.activeSelectionForeground': isLight ? darken(accent, 0.12) : lighten(accent, 0.12),
		'list.inactiveSelectionBackground': isLight ? withAlpha(accent, 0.08) : surface,
		'list.inactiveSelectionForeground': fg,
		'list.hoverBackground': isLight ? withAlpha(accent, 0.05) : surface,
		'list.hoverForeground': fg,
		'list.focusBackground': isLight ? withAlpha(accent, 0.12) : surface,
		'list.focusForeground': fg,
		'list.focusOutline': accent,
		'list.highlightForeground': accent,

		'menu.background': inputBg,
		'menu.foreground': fg,
		'menu.border': border,
		'menu.separatorBackground': border,
		'menu.selectionBackground': accent,
		'menu.selectionForeground': '#ffffff',
		'menubar.selectionBackground': withAlpha(accent, 0.25),
		'menubar.selectionForeground': fg,

		'quickInput.background': surface,
		'quickInput.foreground': fg,
		'quickInputTitle.background': surface,
		'quickInputList.focusBackground': accent,
		'quickInputList.focusForeground': '#ffffff',
		'pickerGroup.foreground': accent,
		'pickerGroup.border': border,

		'badge.background': accent,
		'badge.foreground': '#ffffff',
		'counterBadge.background': accent,
		'counterBadge.foreground': '#ffffff',

		'scrollbarSlider.background': withAlpha(accent, 0.15),
		'scrollbarSlider.hoverBackground': withAlpha(accent, 0.30),
		'scrollbarSlider.activeBackground': withAlpha(accent, 0.45),
		'scrollbar.shadow': isLight ? withAlpha('#000000', 0.08) : withAlpha('#000000', 0.25),

		'progressBar.background': accent,

		'gitDecoration.modifiedResourceForeground': isLight ? '#7d4900' : '#e0a040',
		'gitDecoration.untrackedResourceForeground': isLight ? darken(accent, 0.10) : lighten(accent, 0.15),
		'gitDecoration.ignoredResourceForeground': fgSubtle,
		'gitDecoration.conflictingResourceForeground': isLight ? '#b00020' : '#ff5b6b',

		'editorOverviewRuler.findMatchForeground': withAlpha(accent, 0.6),
		'editorOverviewRuler.selectionHighlightForeground': withAlpha(accent, 0.4),
		'editorOverviewRuler.border': border,

		'minimap.findMatchHighlight': accent,
		'minimap.selectionHighlight': withAlpha(accent, 0.5),

		'breadcrumb.background': chrome,
		'breadcrumb.foreground': fgMuted,
		'breadcrumb.focusForeground': accent,
		'breadcrumb.activeSelectionForeground': accent,
		'breadcrumbPicker.background': surface,

		'notificationCenter.border': border,
		'notifications.background': surface,
		'notifications.foreground': fg,
		'notifications.border': border,
		'notificationLink.foreground': accent,

		'editorGutter.modifiedBackground': isLight ? '#7d4900' : '#e0a040',
		'editorGutter.addedBackground': isLight ? '#0f7b3a' : '#5fd47f',
		'editorGutter.deletedBackground': isLight ? '#c62a47' : '#e8465f',
	};
}

const STATE_CURRENT = 'maut.theme.current';
const STATE_NAMED = 'maut.theme.named';

function loadCurrent(context: vscode.ExtensionContext): Snapshot {
	return context.globalState.get<Snapshot>(STATE_CURRENT) ?? DEFAULT_DARK;
}

function saveCurrent(context: vscode.ExtensionContext, snap: Snapshot): Thenable<void> {
	return context.globalState.update(STATE_CURRENT, snap);
}

function loadNamed(context: vscode.ExtensionContext): NamedSnapshot[] {
	return context.globalState.get<NamedSnapshot[]>(STATE_NAMED) ?? [];
}

function saveNamed(context: vscode.ExtensionContext, list: NamedSnapshot[]): Thenable<void> {
	return context.globalState.update(STATE_NAMED, list);
}

async function applySnapshot(snap: Snapshot): Promise<void> {
	const cfg = vscode.workspace.getConfiguration();
	const colors = buildPalette(snap);
	const baseTheme = snap.mode === 'light' ? 'Default Light Modern' : 'Default Dark Modern';
	await cfg.update('workbench.colorTheme', baseTheme, vscode.ConfigurationTarget.Global);
	await cfg.update('workbench.colorCustomizations', colors, vscode.ConfigurationTarget.Global);
	await cfg.update('editor.fontFamily', snap.fontFamily, vscode.ConfigurationTarget.Global);
	await cfg.update('editor.fontSize', snap.fontSize, vscode.ConfigurationTarget.Global);
	await cfg.update('terminal.integrated.fontFamily', snap.fontFamily, vscode.ConfigurationTarget.Global);
	await cfg.update('terminal.integrated.fontSize', snap.fontSize, vscode.ConfigurationTarget.Global);
}

async function legacyToggle(context: vscode.ExtensionContext): Promise<void> {
	const current = loadCurrent(context);
	const next: Snapshot = current.mode === 'light'
		? { ...DEFAULT_DARK, accent: current.accent }
		: { ...DEFAULT_LIGHT, accent: current.accent };
	await applySnapshot(next);
	await saveCurrent(context, next);
	vscode.window.setStatusBarMessage(`Maut · ${next.mode === 'light' ? 'Light' : 'Dark'}`, 2000);
}

let activePanel: vscode.WebviewPanel | undefined;

interface StudioMessage {
	type: string;
	snap?: Snapshot;
	name?: string;
	json?: string;
}

function openStudio(context: vscode.ExtensionContext): void {
	if (activePanel) {
		activePanel.reveal(vscode.ViewColumn.Beside);
		return;
	}
	const panel = vscode.window.createWebviewPanel(
		'maut.themeStudio',
		'Maut Theme Studio',
		vscode.ViewColumn.Beside,
		{ enableScripts: true, retainContextWhenHidden: true },
	);
	activePanel = panel;
	panel.onDidDispose(() => { activePanel = undefined; });

	const htmlPath = path.join(context.extensionPath, 'media', 'studio.html');
	panel.webview.html = fs.readFileSync(htmlPath, 'utf8');

	const post = () => {
		panel.webview.postMessage({
			type: 'state',
			current: loadCurrent(context),
			named: loadNamed(context),
			presets: PRESETS,
		});
	};
	post();

	panel.webview.onDidReceiveMessage(async (msg: StudioMessage) => {
		switch (msg.type) {
			case 'apply': {
				if (!msg.snap) { return; }
				await applySnapshot(msg.snap);
				await saveCurrent(context, msg.snap);
				return;
			}
			case 'saveAs': {
				if (!msg.snap || !msg.name) { return; }
				const list = loadNamed(context).filter(t => t.name !== msg.name);
				list.unshift({ ...msg.snap, name: msg.name });
				await saveNamed(context, list);
				post();
				return;
			}
			case 'deleteNamed': {
				if (!msg.name) { return; }
				const list = loadNamed(context).filter(t => t.name !== msg.name);
				await saveNamed(context, list);
				post();
				return;
			}
			case 'export': {
				const data = JSON.stringify({ current: loadCurrent(context), named: loadNamed(context) }, null, 2);
				const doc = await vscode.workspace.openTextDocument({ language: 'json', content: data });
				await vscode.window.showTextDocument(doc, vscode.ViewColumn.Active);
				return;
			}
			case 'import': {
				if (!msg.json) { return; }
				try {
					const parsed = JSON.parse(msg.json) as { current?: Snapshot; named?: NamedSnapshot[] };
					if (parsed.current) {
						await applySnapshot(parsed.current);
						await saveCurrent(context, parsed.current);
					}
					if (parsed.named) {
						await saveNamed(context, parsed.named);
					}
					post();
					vscode.window.showInformationMessage('Maut: theme imported.');
				} catch (e) {
					vscode.window.showErrorMessage(`Maut: import failed — ${e instanceof Error ? e.message : 'bad JSON'}`);
				}
				return;
			}
			case 'reset': {
				const fresh = msg.snap?.mode === 'light' ? DEFAULT_LIGHT : DEFAULT_DARK;
				await applySnapshot(fresh);
				await saveCurrent(context, fresh);
				post();
				return;
			}
		}
	});
}

function setupStatusBar(context: vscode.ExtensionContext): void {
	const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 9_500);
	item.command = 'maut.theme.studio';
	item.text = '$(symbol-color)  Theme';
	item.tooltip = 'Maut Theme Studio — pick colour, font, mode';
	item.show();
	context.subscriptions.push(item);
}

export function activate(context: vscode.ExtensionContext): void {
	context.subscriptions.push(
		vscode.commands.registerCommand('maut.theme.toggle', () => legacyToggle(context)),
		vscode.commands.registerCommand('maut.theme.studio', () => openStudio(context)),
	);
	setupStatusBar(context);
}

export function deactivate(): void { /* noop */ }
