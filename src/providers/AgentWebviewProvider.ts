import * as vscode from 'vscode';
import { COMMANDS, CONFIG_KEYS, ICONS } from '../constants';
import { validateCliAvailability } from '../utils/ValidationUtils';

export class AgentWebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'multi-agent-view';
    private _view?: vscode.WebviewView;

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

    public async update() {
        if (this._view) {
            const fileName = this._context.workspaceState.get<string>(CONFIG_KEYS.LOADED_FILE_NAME) || '';
            const isLoaded = !!fileName;

            let isCliAvailable = true;
            let serviceName = 'Cursor'; // Default

            if (isLoaded) {
                const config = vscode.workspace.getConfiguration('multiAgentRunner');
                serviceName = config.get<string>(CONFIG_KEYS.AGENT_SERVICE) || 'Cursor';
                const command = serviceName === 'Cursor' ? 'cursor' : 'gemini';
                isCliAvailable = await validateCliAvailability(command);
            }

            this._view.webview.html = this._getHtmlForWebview(this._view.webview, fileName, isLoaded, isCliAvailable, serviceName);
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview, fileName: string, isLoaded: boolean, isCliAvailable: boolean, serviceName: string) {
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
                    .card {
                        border: 1px solid var(--vscode-widget-border);
                        border-radius: 8px;
                        padding: 12px;
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        background: var(--vscode-sideBar-background);
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
                    ` : !isCliAvailable ? `
                        <div class="card error">
                            <div class="icon-container">
                                ${ICONS.COPILOT_NOT_CONNECTED}
                            </div>
                            <div class="error-message">
                                CLI not found: ${serviceName}
                            </div>
                            <div class="actions">
                                <button class="action-btn" onclick="clearYaml()" title="クリア">
                                    ${ICONS.CLEAR_ALL}
                                </button>
                            </div>
                        </div>
                    ` : `
                        <div class="card">
                            <div class="icon-container">
                                ${ICONS.COPILOT_LARGE}
                            </div>
                            <div class="file-name">${fileName}</div>
                            <div class="actions">
                                <button class="action-btn" onclick="clearYaml()" title="クリア">
                                    ${ICONS.CLEAR_ALL}
                                </button>
                                <button class="action-btn" onclick="runAgent()" title="実行">
                                    ${ICONS.PLAY}
                                </button>
                            </div>
                        </div>
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

