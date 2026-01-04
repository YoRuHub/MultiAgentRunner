import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "multi-agent-runner" is now active!');

	let disposable = vscode.commands.registerCommand('multi-agent-runner.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from MultiAgentRunner!');
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
