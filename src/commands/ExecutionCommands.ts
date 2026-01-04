import * as vscode from 'vscode';
import { COMMANDS } from '../constants';

export function registerExecutionCommands(context: vscode.ExtensionContext) {
    let runAgent = vscode.commands.registerCommand(COMMANDS.RUN_AGENT, () => {
        vscode.window.showInformationMessage(`Running agents...`);
        // TODO: Implement actual execution logic here
    });

    context.subscriptions.push(runAgent);
}
