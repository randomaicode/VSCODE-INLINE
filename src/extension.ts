
import * as vscode from 'vscode';
import axios from 'axios';
console.log('Extension "Inline LLM Editor" is now active!');

const API_URL = "http://localhost:11435/api/generate"; // Replace with your LLM API endpoint

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension "Inline LLM Editor" is now active!');

    const disposable = vscode.commands.registerCommand('inlineLLMEditor.inlineInput', async () => {
        const editor = vscode.window.activeTextEditor;

        if (!editor) {
            vscode.window.showErrorMessage("No active editor found!");
            console.error("[ERROR]: No active editor found.");
            return;
        }

        const selection = editor.selection;
        if (selection.isEmpty) {
            vscode.window.showErrorMessage("No code selected! Highlight some code to use this feature.");
            console.error("[ERROR]: No code selected.");
            return;
        }

        // Prompt the user for input using showInputBox
        const userPrompt = await vscode.window.showInputBox({
            prompt: 'Enter your prompt for modifying the selected code',
            placeHolder: 'e.g., Optimize this function',
            ignoreFocusOut: true
        });

        if (typeof userPrompt === 'undefined') {
            // User canceled the input
            console.log("[INFO]: User canceled the input.");
            return;
        }

        console.log("[INFO]: User prompt:", userPrompt);

        const startLine = selection.start.line;
        const endLine = selection.end.line;
        const totalLines = editor.document.lineCount;

        const contextStart = Math.max(0, startLine - 50);
        const contextEnd = Math.min(totalLines - 1, endLine + 50);

        const selectedText = editor.document.getText(selection);
        const contextText = editor.document.getText(
            new vscode.Range(
                new vscode.Position(contextStart, 0),
                new vscode.Position(contextEnd, editor.document.lineAt(contextEnd).range.end.character)
            )
        );

        console.log(`[INFO]: Selected lines ${startLine + 1}-${endLine + 1}`);
        console.log(`[INFO]: Context range: lines ${contextStart + 1} to ${contextEnd + 1}`);
        console.log(`[INFO]: Context extracted:\n${contextText}`);

        try {
            const response = await sendToLLM(userPrompt, selectedText, contextText);
            console.log("[INFO]: LLM response:\n", response);

            const cleanedResponse = cleanCode(response);
            console.log("[INFO]: Cleaned response:\n", cleanedResponse);

            await editor.edit((editBuilder) => {
                editBuilder.replace(selection, cleanedResponse);
            });

            vscode.window.showInformationMessage("Code updated successfully!");
        } catch (error) {
            console.error("[ERROR]: Error during LLM processing:", error);
            vscode.window.showErrorMessage("Failed to update the code. Check the console for details.");
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {
    console.log('Extension "Inline LLM Editor" has been deactivated.');
}

async function sendToLLM(prompt: string, selectedCode: string, context: string): Promise<string> {
    const requestPayload = {
        model: "qwen2.5-coder:14b",
        prompt: `
The user provided this prompt: ${prompt}

The selected code is:
${selectedCode}

The context around the code is:
${context}

Modify ONLY the selected code based on the user's request. Output ONLY the updated code.
        `,
        stream: false,
    };

    console.log("[INFO]: Sending request payload to LLM API:\n", JSON.stringify(requestPayload, null, 2));

    const response = await axios.post(API_URL, requestPayload);
    console.log("[INFO]: Received response from LLM API with status:", response.status);

    return response.data.response.trim();
}

function cleanCode(code: string): string {
    const cleaned = code
        .split("\n")
        .filter((line) => !line.trim().startsWith("```"))
        .join("\n");

    console.log("[INFO]: Cleaned code (removed markdown formatting):\n", cleaned);
    return cleaned;
}
