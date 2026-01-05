import * as vscode from 'vscode';
import { COMMANDS, CONFIG_KEYS, ICONS } from '../constants';
import { validateCliAvailability } from '../utils/ValidationUtils';

export interface TaskItem {
    id: string;
    description: string;
    checkContent: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
}

export class AgentWebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'multi-agent-view';
    private _view?: vscode.WebviewView;
    private _tasks: TaskItem[] = [];
    private _isProcessing: boolean = false;

    constructor(
        private readonly _context: vscode.ExtensionContext,
    ) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._context.extensionUri]
        };

        this.update();

        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'selectYaml':
                    vscode.commands.executeCommand(COMMANDS.SELECT_YAML);
                    break;
                case 'runAgent':
                    vscode.commands.executeCommand(COMMANDS.RUN_AGENT);
                    break;
                case 'clearYaml':
                    vscode.commands.executeCommand(COMMANDS.CLEAR_YAML);
                    break;
                case 'openSettings':
                    vscode.commands.executeCommand(COMMANDS.OPEN_SETTINGS);
                    break;
            }
        });
    }

    public clearTasks() {
        this._tasks = [];
        this._isProcessing = false;
    }

    public async update(tasks?: TaskItem[], isProcessing?: boolean) {
        if (tasks) {
            this._tasks = tasks;
        }
        if (isProcessing !== undefined) {
            this._isProcessing = isProcessing;
        }

        if (this._view) {
            const fileName = this._context.workspaceState.get<string>(CONFIG_KEYS.LOADED_FILE_NAME) || '';
            const isLoaded = !!fileName;

            let isCliAvailable = true;
            let serviceName = 'Cursor'; // Default

            if (isLoaded && this._tasks.length === 0) {
                const config = vscode.workspace.getConfiguration('multiAgentRunner');
                serviceName = config.get<string>(CONFIG_KEYS.AGENT_SERVICE) || 'Cursor';
                const command = serviceName === 'Cursor' ? 'cursor' : 'gemini';
                isCliAvailable = await validateCliAvailability(command);
            }

            this._view.webview.html = this._getHtmlForWebview(this._view.webview, fileName, isLoaded, isCliAvailable, serviceName, this._isProcessing);
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview, fileName: string, isLoaded: boolean, isCliAvailable: boolean, serviceName: string, isProcessing: boolean) {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        padding: 12px;
                        color: var(--vscode-foreground);
                        font-family: var(--vscode-font-family);
                        overflow: hidden;
                    }
                    .container {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    }
                    .section-title {
                        font-size: 11px;
                        font-weight: bold;
                        text-transform: uppercase;
                        color: var(--vscode-descriptionForeground);
                        margin-bottom: 4px;
                        padding-left: 4px;
                    }
                    .card {
                        border: 1px solid var(--vscode-widget-border);
                        border-radius: 8px;
                        padding: 12px;
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        background: var(--vscode-sideBar-background);
                    }
                    .task-card {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 8px;
                        margin-bottom: 8px;
                    }
                    .task-header {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .task-id {
                        font-family: var(--vscode-editor-font-family);
                        font-size: 11px;
                        background: var(--vscode-badge-background);
                        color: var(--vscode-badge-foreground);
                        padding: 2px 6px;
                        border-radius: 4px;
                    }
                    .task-status {
                        width: 8px;
                        height: 8px;
                        border-radius: 50%;
                    }
                    .status-pending { background: var(--vscode-descriptionForeground); opacity: 0.5; }
                    .status-running { background: var(--vscode-progressBar-background); animation: pulse 1.5s infinite; }
                    .status-completed { background: #4ec9b0; }
                    .status-failed { background: var(--vscode-errorForeground); }

                    @keyframes pulse {
                        0% { opacity: 0.4; transform: scale(0.9); }
                        50% { opacity: 1; transform: scale(1.1); }
                        100% { opacity: 0.4; transform: scale(0.9); }
                    }

                    @keyframes rotate {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }

                    @keyframes blink {
                        0%, 100% { opacity: 0.3; }
                        50% { opacity: 1; }
                    }

                    .rotating {
                        animation: rotate 2s linear infinite;
                    }

                    .dots-container {
                        display: flex;
                        justify-content: center;
                        gap: 8px;
                        margin: 4px 0 12px 0;
                        font-size: 24px;
                        font-weight: bold;
                        color: rgba(255, 255, 255, 0.85);
                        line-height: 1;
                    }

                    .dot {
                        animation: blink 1.4s infinite both;
                    }
                    .dot:nth-child(2) { animation-delay: 0.2s; }
                    .dot:nth-child(3) { animation-delay: 0.4s; }

                    .task-body {
                        font-size: 12px;
                        line-height: 1.4;
                    }
                    .task-check {
                        font-size: 11px;
                        color: var(--vscode-descriptionForeground);
                        margin-top: 4px;
                        border-left: 2px solid var(--vscode-widget-border);
                        padding-left: 8px;
                    }
                    .card.error {
                        border-color: var(--vscode-inputValidation-errorBorder);
                        background: var(--vscode-inputValidation-errorBackground);
                    }
                    .icon-container {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: rgba(255, 255, 255, 0.85); /* Softer white instead of pure white */
                    }
                    .file-name {
                        flex: 1;
                        font-size: 13px;
                        word-break: break-all;
                        font-family: var(--vscode-editor-font-family);
                    }
                    .error-message {
                        flex: 1;
                        font-size: 12px;
                        color: rgba(255, 255, 255, 0.85); /* Consistent soft white */
                        word-break: break-word;
                    }
                    .actions {
                        display: flex;
                        gap: 8px;
                    }
                    .action-btn {
                        background: none;
                        border: none;
                        padding: 4px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: rgba(255, 255, 255, 0.85); /* Consistent soft white */
                        transition: opacity 0.2s, background 0.2s;
                        border-radius: 4px;
                    }
                    .action-btn:hover {
                        opacity: 1;
                        background: var(--vscode-toolbar-hoverBackground);
                    }
                    .action-btn svg {
                        width: 16px;
                        height: 16px;
                    }
                    .empty-btn {
                        width: 100%;
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 8px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 13px;
                    }
                    .empty-btn:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                    .empty-state {
                        text-align: center;
                        padding: 20px 0;
                        color: var(--vscode-descriptionForeground);
                        font-size: 13px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    ${!isLoaded ? `
                        <div class="empty-state">
                            <button class="empty-btn" onclick="selectYaml()">YAMLを選択</button>
                        </div>
                    ` : `
                        <div class="card ${isProcessing ? 'processing' : ''}">
                            <div class="icon-container ${isProcessing ? 'rotating' : ''}">
                                ${isProcessing ? ICONS.SYNC : ICONS.COPILOT_LARGE}
                            </div>
                            <div class="file-name">${fileName}</div>
                            <div class="actions">
                                <button class="action-btn" onclick="clearYaml()" title="クリア" ${isProcessing ? 'disabled' : ''}>
                                    ${ICONS.CLEAR_ALL}
                                </button>
                                <button class="action-btn" onclick="runAgent()" title="実行" ${isProcessing ? 'disabled' : ''}>
                                    ${ICONS.PLAY}
                                </button>
                            </div>
                        </div>
                        ${isProcessing ? `
                            <div class="dots-container">
                                <span class="dot">.</span>
                                <span class="dot">.</span>
                                <span class="dot">.</span>
                            </div>
                        ` : ''}
                        ${this._tasks.length > 0 ? `
                            <div class="header-row" style="display:flex; justify-content:space-between; align-items:center; margin-top: 12px;">
                                <div class="section-title">TASKS</div>
                            </div>
                            ${this._tasks.map(task => `
                                <div class="card task-card">
                                    <div class="task-header">
                                        <div class="task-status status-${task.status}"></div>
                                        <div class="task-id">${task.id}</div>
                                    </div>
                                    <div class="task-body">${task.description}</div>
                                    <div class="task-check">確認: ${task.checkContent}</div>
                                </div>
                            `).join('')}
                        ` : ''}
                    `}
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    function selectYaml() { vscode.postMessage({ type: 'selectYaml' }); }
                    function runAgent() { vscode.postMessage({ type: 'runAgent' }); }
                    function clearYaml() { vscode.postMessage({ type: 'clearYaml' }); }
                    function openSettings() { vscode.postMessage({ type: 'openSettings' }); }
                </script>
            </body>
            </html>
        `;
    }
}

