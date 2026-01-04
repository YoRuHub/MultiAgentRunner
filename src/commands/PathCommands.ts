import * as vscode from 'vscode';
import { AgentWebviewProvider } from '../providers/AgentWebviewProvider';
import { COMMANDS, CONFIG_KEYS } from '../constants';

export function registerPathCommands(context: vscode.ExtensionContext, agentWebviewProvider: AgentWebviewProvider) {
    let selectYamlPath = vscode.commands.registerCommand(COMMANDS.SELECT_YAML, async () => {
        const fileUri = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: 'YAMLを選択',
            filters: {
                'YAML': ['yml', 'yaml']
            }
        });

        if (fileUri && fileUri[0]) {
            const fileName = fileUri[0].fsPath.split(/[\\/]/).pop() || fileUri[0].fsPath;
            await vscode.workspace.getConfiguration('multiAgentRunner').update(CONFIG_KEYS.LOADED_FILE_NAME, fileName, vscode.ConfigurationTarget.Global);

            agentWebviewProvider.update();
            vscode.commands.executeCommand('setContext', 'multiAgentRunnerYamlLoaded', true);
            vscode.window.showInformationMessage(`Loaded: ${fileUri[0].fsPath}`);
        }
    });

    let clearYaml = vscode.commands.registerCommand(COMMANDS.CLEAR_YAML, async () => {
        await vscode.workspace.getConfiguration('multiAgentRunner').update(CONFIG_KEYS.LOADED_FILE_NAME, '', vscode.ConfigurationTarget.Global);
        agentWebviewProvider.update();
        vscode.commands.executeCommand('setContext', 'multiAgentRunnerYamlLoaded', false);
    });

    context.subscriptions.push(selectYamlPath, clearYaml);
}
