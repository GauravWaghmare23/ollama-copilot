import * as vscode from "vscode";

import { InlineProvider } from "./inlineProvider";
import { ChatProvider } from "./chatProvider";
import { askOllama } from "./ollama";

export function activate(
	context: vscode.ExtensionContext
) {
	console.log("================================");
	console.log("OLLAMA COPILOT ACTIVATED");
	console.log("================================");

	// Inline Suggestions
	const inlineProvider =
		vscode.languages.registerInlineCompletionItemProvider(
			[
				{ language: "javascript" },
				{ language: "typescript" },
				{ language: "javascriptreact" },
				{ language: "typescriptreact" }
			],
			new InlineProvider()
		);

	context.subscriptions.push(
		inlineProvider
	);

	// Chat Sidebar
	console.log("Creating ChatProvider");

	const chatProvider =
		new ChatProvider(context);

	console.log("Registering ChatProvider");

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			ChatProvider.viewType,
			chatProvider
		)
	);

	console.log("ChatProvider Registered");

	// Generate Code Command
	const generateCommand =
		vscode.commands.registerCommand(
			"ollama.generateCode",
			async () => {

				const prompt =
					await vscode.window.showInputBox({
						prompt:
							"Describe the code to generate"
					});

				if (!prompt) {
					return;
				}

				try {

					vscode.window.showInformationMessage(
						"Generating code with Ollama..."
					);

					const response =
						await askOllama(`
You are an expert software engineer.

Return ONLY code.

Do not explain.
Do not add markdown.
Do not use triple backticks.

Task:
${prompt}
`);

					const cleaned =
						extractCode(response);

					const editor =
						vscode.window.activeTextEditor;

					if (editor) {

						await editor.insertSnippet(
							new vscode.SnippetString(
								cleaned
							)
						);

						vscode.window.showInformationMessage(
							"Code generated successfully"
						);
					}

				} catch (error) {

					console.error(error);

					vscode.window.showErrorMessage(
						"Failed to generate code"
					);

				}

			}
		);

	context.subscriptions.push(
		generateCommand
	);

	console.log(
		"Ollama Copilot Ready"
	);
}

function extractCode(
	text: string
): string {

	const match =
		text.match(
			/```(?:\w+)?\n([\s\S]*?)```/
		);

	if (match) {
		return match[1];
	}

	return text
		.replace(/^Certainly!.*?\n/gs, "")
		.trim();
}

export function deactivate() {
	console.log(
		"Ollama Copilot Deactivated"
	);
}