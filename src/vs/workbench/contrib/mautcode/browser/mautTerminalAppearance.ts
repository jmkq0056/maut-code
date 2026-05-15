/*---------------------------------------------------------------------------------------------
 *  Maut code: workbench command that programmatically sets a terminal's icon and color
 *  without going through the user-facing quick pick.
 *--------------------------------------------------------------------------------------------*/

import { CommandsRegistry } from '../../../../platform/commands/common/commands.js';
import { ITerminalGroupService, ITerminalService } from '../../terminal/browser/terminal.js';

interface SetAppearanceArgs {
	terminalName?: string;
	icon?: string;
	color?: string;
}

CommandsRegistry.registerCommand('maut.terminal.setAppearance', async (accessor, args?: SetAppearanceArgs) => {
	if (!args) { return; }
	const terminalService = accessor.get(ITerminalService);
	const groupService = accessor.get(ITerminalGroupService);
	let instance = terminalService.activeInstance;
	if (args.terminalName) {
		const match = [
			...terminalService.instances,
			...groupService.instances,
		].find(t => t.title === args.terminalName || t.shellLaunchConfig?.name === args.terminalName);
		if (match) { instance = match; }
	}
	if (!instance) { return; }
	if (args.icon) {
		try { await instance.changeIcon({ id: args.icon }); } catch { /* noop */ }
	}
	if (args.color) {
		try { await instance.changeColor(args.color, true); } catch { /* noop */ }
	}
});
