import * as vscode from "vscode";
import { askOllama } from "./ollama";

export class ChatProvider
    implements vscode.WebviewViewProvider {

    public static readonly viewType =
        "ollamaChat";

    private lastResponse = "";

    constructor(
        private readonly context:
            vscode.ExtensionContext
    ) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView
    ) {

        console.log(
            "CHAT WEBVIEW OPENED"
        );

        webviewView.webview.options = {
            enableScripts: true,
        };

        webviewView.webview.html =
            this.getHtml();

        webviewView.webview.onDidReceiveMessage(
            async (message) => {

                try {

                    switch (
                    message.command
                    ) {

                        case "ask": {

                            console.log(
                                "ASKING OLLAMA..."
                            );

                            const answer = await askOllama(`
You are an expert software engineer.

Return code only.

Do not explain.
Do not use markdown.
Do not use backticks.

Task:
${message.prompt}
`);

                            this.lastResponse =
                                this.extractCode(
                                    answer
                                );

                            webviewView.webview.postMessage({
                                command: "answer",
                                text: this.lastResponse
                            });

                            console.log(
                                "ANSWER SENT"
                            );

                            break;
                        }

                        case "insert": {

                            const editor =
                                vscode.window
                                    .activeTextEditor;

                            if (!editor) {

                                vscode.window.showErrorMessage(
                                    "No active editor found"
                                );

                                return;
                            }

                            await editor.insertSnippet(
                                new vscode.SnippetString(
                                    this.lastResponse
                                )
                            );

                            vscode.window.showInformationMessage(
                                "Code inserted successfully"
                            );

                            break;
                        }

                    }

                } catch (error) {

                    console.error(error);

                    webviewView.webview.postMessage({
                        command: "answer",
                        text:
                            "Error talking to Ollama"
                    });

                }
            }
        );
    }

    private extractCode(
        text: string
    ): string {

        const match =
            text.match(
                /```(?:\w+)?\n([\s\S]*?)```/
            );

        if (match) {
            return match[1].trim();
        }

        return text
            .replace(
                /^Certainly!.*?\n/gs,
                ""
            )
            .trim();
    }

    private getHtml(): string {

        return `
<!DOCTYPE html>
<html>

<head>

<style>

body{
  padding:12px;
  font-family:sans-serif;
}

textarea{
  width:100%;
  height:120px;
  resize:vertical;
}

button{
  width:100%;
  margin-top:10px;
  padding:10px;
  cursor:pointer;
}

#status{
  margin-top:10px;
  color:orange;
}

pre{
  margin-top:10px;
  white-space:pre-wrap;
  max-height:300px;
  overflow:auto;
  border:1px solid #444;
  padding:10px;
}

</style>

</head>

<body>

<h2>🤖 Ollama AI Chat</h2>

<textarea
id="prompt"
placeholder="Ask Ollama..."
></textarea>

<button id="askBtn">
🚀 Ask AI
</button>

<button id="insertBtn">
📄 Insert Into File
</button>

<div id="status"></div>

<pre id="result"></pre>

<script>

const vscode =
acquireVsCodeApi();

const askBtn =
document.getElementById(
"askBtn"
);

const insertBtn =
document.getElementById(
"insertBtn"
);

const status =
document.getElementById(
"status"
);

askBtn.addEventListener(
"click",
() => {

const prompt =
document.getElementById(
"prompt"
).value;

status.textContent =
"Thinking...";

vscode.postMessage({
command:"ask",
prompt
});

}
);

insertBtn.addEventListener(
"click",
() => {

vscode.postMessage({
command:"insert"
});

}
);

window.addEventListener(
"message",
(event) => {

const msg =
event.data;

if(
msg.command === "answer"
){

status.textContent =
"Completed";

document.getElementById(
"result"
).textContent =
msg.text;

}

}
);

</script>

</body>

</html>
`;
    }
}