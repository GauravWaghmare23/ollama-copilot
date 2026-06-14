import * as vscode from "vscode";
import { askOllama } from "./ollama";

export class InlineProvider
  implements vscode.InlineCompletionItemProvider {

  private lastRequest = 0;

  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _context: vscode.InlineCompletionContext,
    _token: vscode.CancellationToken
  ): Promise<vscode.InlineCompletionList> {

    console.log("================================");
    console.log("MY INLINE PROVIDER TRIGGERED");
    console.log("FILE:", document.fileName);
    console.log("LINE:", position.line);
    console.log("CHAR:", position.character);
    console.log("================================");

    const now = Date.now();

    if (now - this.lastRequest < 2000) {
      console.log("RATE LIMITED");
      return { items: [] };
    }

    this.lastRequest = now;

    const contextText = document.getText(
      new vscode.Range(
        new vscode.Position(
          Math.max(0, position.line - 20),
          0
        ),
        position
      )
    );

    console.log("CONTEXT:");
    console.log(contextText);

    if (contextText.trim().length < 10) {
      console.log("NOT ENOUGH CONTEXT");
      return { items: [] };
    }

    try {

      console.log("SENDING TO OLLAMA");

      const response = await askOllama(`
You are an autocomplete engine.

Continue the code.

Return ONLY the next 1-3 lines.

No markdown.
No explanation.
No backticks.

${contextText}
`);

      console.log("RAW RESPONSE:");
      console.log(response);

      const completion = response
        .replace(/```[\s\S]*?```/g, "")
        .replace(/```/g, "")
        .trim();

      console.log("CLEANED RESPONSE:");
      console.log(completion);

      if (!completion) {
        return { items: [] };
      }

      return {
        items: [
          {
            insertText: completion,
            range: new vscode.Range(
              position,
              position
            )
          }
        ]
      };

    } catch (error) {

      console.error("INLINE ERROR");
      console.error(error);

      return { items: [] };
    }
  }
}