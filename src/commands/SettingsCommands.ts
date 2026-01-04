import * as vscode from 'vscode';
import { COMMANDS } from '../constants';

export function registerSettingsCommands(context: vscode.ExtensionContext) {
    let openSettings = vscode.commands.registerCommand(COMMANDS.OPEN_SETTINGS, () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'multi-agent-runner');
    });

    context.subscriptions.push(openSettings);
}
