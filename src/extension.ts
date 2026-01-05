import * as vscode from 'vscode';
import { registerSettingsCommands } from './commands/SettingsCommands';
import { registerPathCommands } from './commands/PathCommands';
import { registerExecutionCommands } from './commands/ExecutionCommands';
import { AgentWebviewProvider } from './providers/AgentWebviewProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Multi-Agent Runner is now active');

    // Providers
    const agentWebviewProvider = new AgentWebviewProvider(context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(AgentWebviewProvider.viewType, agentWebviewProvider)
    );

    // Register Commands
    registerSettingsCommands(context);
    registerPathCommands(context, agentWebviewProvider);
    registerExecutionCommands(context, agentWebviewProvider);
}

export function deactivate() { }
