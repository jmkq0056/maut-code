/*---------------------------------------------------------------------------------------------
 *  Maut code: triple-click a file/folder row in the explorer, or an editor tab, to reveal it
 *  in Finder. Workbench-level because the explorer's built-in click handlers don't expose
 *  a triple-click hook to extensions.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { URI } from '../../../../base/common/uri.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';
import { IWorkbenchContribution, WorkbenchPhase, registerWorkbenchContribution2 } from '../../../common/contributions.js';

class MautTripleClickReveal extends Disposable implements IWorkbenchContribution {

	static readonly ID = 'workbench.contrib.mautcode.tripleClickReveal';

	constructor(
		@ICommandService private readonly commandService: ICommandService,
	) {
		super();
		const handler = (e: MouseEvent) => this.onClick(e);
		document.addEventListener('click', handler, true);
		this._register({ dispose: () => document.removeEventListener('click', handler, true) });
	}

	private onClick(e: MouseEvent): void {
		if (e.detail !== 3) { return; }
		const target = e.target as HTMLElement | null;
		if (!target) { return; }

		// 1) Explorer tree row.
		const explorerRow = target.closest('.monaco-list-row');
		if (explorerRow && document.querySelector('.explorer-folders-view .monaco-list-row.focused, .explorer-folders-view .monaco-list-row.selected')) {
			const resourceEl = explorerRow.querySelector('[data-resource-name], [data-uri]') as HTMLElement | null;
			let resourcePath: string | undefined;
			if (resourceEl) {
				resourcePath = resourceEl.getAttribute('data-uri') ?? undefined;
			}
			if (!resourcePath) {
				// Fallback: grab the aria-label on the row (usually the relative path).
				resourcePath = explorerRow.getAttribute('aria-label') ?? undefined;
			}
			// Easier path: invoke the standard reveal command — it works on whatever is currently
			// focused in the explorer, which is the row that received this click.
			void this.commandService.executeCommand('revealFileInOS').catch(() => { /* noop */ });
			e.preventDefault();
			e.stopPropagation();
			return;
		}

		// 2) Editor tab.
		const tab = target.closest('.tab.tab-actions-right, .tab.tab-actions-left, .tab');
		if (tab) {
			const resourceUriAttr = tab.querySelector('[data-resource-name]')?.getAttribute('data-resource-name')
				?? tab.getAttribute('data-resource-name');
			let uri: URI | undefined;
			if (resourceUriAttr) {
				try { uri = URI.parse(resourceUriAttr); } catch { /* noop */ }
			}
			if (uri) {
				void this.commandService.executeCommand('revealFileInOS', uri).catch(() => { /* noop */ });
			} else {
				// Fall back to current active editor's resource.
				void this.commandService.executeCommand('workbench.action.files.revealActiveFileInWindows').catch(() => { });
				void this.commandService.executeCommand('revealFileInOS').catch(() => { });
			}
			e.preventDefault();
			e.stopPropagation();
			return;
		}
	}
}

registerWorkbenchContribution2(MautTripleClickReveal.ID, MautTripleClickReveal, WorkbenchPhase.AfterRestored);
