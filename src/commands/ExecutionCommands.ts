import * as vscode from 'vscode';
import { COMMANDS } from '../constants';
import { AgentWebviewProvider, TaskItem } from '../providers/AgentWebviewProvider';

export function registerExecutionCommands(context: vscode.ExtensionContext, agentWebviewProvider: AgentWebviewProvider) {
    let runAgent = vscode.commands.registerCommand(COMMANDS.RUN_AGENT, async () => {
        // Start processing (loading state)
        agentWebviewProvider.update([], true);
        vscode.window.showInformationMessage(`Agent is thinking...`);

        // Simulate delay (2 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mock tasks as requested by the user
        const mockTasks: TaskItem[] = [
            {
                id: 'TEST-001',
                description: '正しいユーザー情報でポータルにアクセスする',
                checkContent: 'ダッシュボード画面が正常に表示されること',
                status: 'running'
            },
            {
                id: 'TEST-002',
                description: 'セッションを終了してシステムから退出する',
                checkContent: 'ログアウト完了メッセージが表示され、ログイン画面に戻ること',
                status: 'pending'
            },
            {
                id: 'TEST-003',
                description: '入力したフォームデータをサーバーに送信する',
                checkContent: '「保存が完了しました」という通知が表示されること',
                status: 'pending'
            }
        ];

        // Finish processing and show tasks
        agentWebviewProvider.update(mockTasks, false);
        vscode.window.showInformationMessage(`Tasks fragmentation completed.`);
    });

    context.subscriptions.push(runAgent);
}
