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
<html lang="en">

<head>
<meta charset="UTF-8">

<style>

:root{
  --radius:16px;
}

*{
  box-sizing:border-box;
}

body{
  margin:0;
  padding:16px;
  font-family:var(--vscode-font-family);
  background:var(--vscode-editor-background);
  color:var(--vscode-foreground);
}

.container{
  display:flex;
  flex-direction:column;
  gap:14px;
}

.header{
  padding:18px;
  border-radius:16px;
  background:
  linear-gradient(
    135deg,
    rgba(59,130,246,.15),
    rgba(139,92,246,.15)
  );

  border:1px solid rgba(255,255,255,.08);
}

.logo{
  font-size:34px;
  margin-bottom:8px;
}

.title{
  font-size:22px;
  font-weight:700;
}

.subtitle{
  margin-top:6px;
  font-size:12px;
  opacity:.7;
}

.card{
  background:
    var(--vscode-editorWidget-background);

  border:1px solid rgba(255,255,255,.08);

  border-radius:16px;

  padding:14px;
}

.label{
  font-size:12px;
  font-weight:600;
  opacity:.8;
  margin-bottom:8px;
}

textarea{
  width:100%;
  min-height:140px;
  resize:vertical;

  border:none;
  outline:none;

  border-radius:12px;

  padding:12px;

  background:
    var(--vscode-input-background);

  color:
    var(--vscode-input-foreground);

  font-family:
    Consolas,
    monospace;

  font-size:13px;
}

.actions{
  display:flex;
  gap:10px;
}

button{
  flex:1;

  border:none;

  padding:12px;

  border-radius:12px;

  cursor:pointer;

  font-weight:600;

  transition:.2s;
}

button:hover{
  transform:translateY(-2px);
}

.primary{
  color:white;

  background:
  linear-gradient(
    135deg,
    #3b82f6,
    #8b5cf6
  );
}

.secondary{
  background:
    var(
      --vscode-button-secondaryBackground
    );

  color:
    var(
      --vscode-button-secondaryForeground
    );
}

.statusCard{
  background:
    var(--vscode-editorWidget-background);

  border:1px solid rgba(255,255,255,.08);

  border-radius:16px;

  padding:12px;
}

.status{
  display:flex;
  align-items:center;
  gap:8px;
  font-size:13px;
  font-weight:600;
}

.dot{
  width:10px;
  height:10px;
  border-radius:50%;
  background:#22c55e;
}

.output{
  border-radius:16px;

  overflow:hidden;

  border:1px solid rgba(255,255,255,.08);

  background:
    var(
      --vscode-textCodeBlock-background
    );
}

.outputHeader{
  padding:10px 14px;

  border-bottom:
    1px solid rgba(255,255,255,.08);

  font-size:12px;
  font-weight:600;
  opacity:.75;
}

pre{
  margin:0;

  padding:16px;

  white-space:pre-wrap;

  word-break:break-word;

  overflow:auto;

  max-height:400px;

  font-size:13px;

  line-height:1.6;

  font-family:
    Consolas,
    monospace;
}

.footer{
  text-align:center;
  font-size:11px;
  opacity:.5;
}

</style>

</head>

<body>

<div class="container">

<div class="header">

<div class="logo">
🤖
</div>

<div class="title">
Ollama Copilot
</div>

<div class="subtitle">
Local AI Coding Assistant powered by Ollama
</div>

</div>

<div class="card">

<div class="label">
PROMPT
</div>

<textarea
id="prompt"
placeholder="Describe what you want to generate..."
></textarea>

</div>

<div class="actions">

<button
id="askBtn"
class="primary"
>
🚀 Generate
</button>

<button
id="insertBtn"
class="secondary"
>
📄 Insert
</button>

</div>

<div class="statusCard">

<div
class="status"
id="status"
>
<div class="dot"></div>
Ready
</div>

</div>

<div class="output">

<div class="outputHeader">
GENERATED RESPONSE
</div>

<pre id="result">
Waiting for prompt...
</pre>

</div>

<div class="footer">
Ollama Copilot • Local AI • No API Keys
</div>

</div>

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

status.innerHTML =
'<div class="dot"></div> Generating response...';

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
msg.command ===
"answer"
){

status.innerHTML =
'<div class="dot"></div> Completed';

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