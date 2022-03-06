'use strict';

/** To demonstrate code actions associated with Diagnostics problems, this file provides a mock diagnostics entries. */

import * as vscode from 'vscode';
import sqlLint from 'sql-lint';

/** String to detect in the text document. */
export const SQL_FLAG = '--sql';

// export function activate(context: vscode.ExtensionContext) {

// 	const collection = vscode.languages.createDiagnosticCollection('test');
// 	if (vscode.window.activeTextEditor) {
// 		refreshDiagnostics(vscode.window.activeTextEditor.document, collection);
// 	}
// 	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
// 		if (editor) {
// 			refreshDiagnostics(editor.document, collection);
// 		}
// 	}));
// }

export async function activate(context: vscode.ExtensionContext) {
    const emojiDiagnostics = vscode.languages.createDiagnosticCollection("emoji");
    context.subscriptions.push(emojiDiagnostics);

    await subscribeToDocumentChanges(context, emojiDiagnostics);

}


/**
 * Analyzes the text document for problems.
 * This demo diagnostic problem provider finds all mentions of 'emoji'.
 * @param doc text document to analyze
 * @param emojiDiagnostics diagnostic collection
 */
export async function refreshDiagnostics(doc: vscode.TextDocument, emojiDiagnostics: vscode.DiagnosticCollection): Promise<void> {
    let diagnostics: vscode.Diagnostic[] = [];

    let sqlStartLine = doc.lineAt(0);
    let sqlStartIndex = -1;
    for (let lineIndex = 0; lineIndex < doc.lineCount; lineIndex++) {
        if (sqlStartIndex == -1) {
            const lineOfText = doc.lineAt(lineIndex);
            if (lineOfText.text.includes(SQL_FLAG)) {
                sqlStartLine = lineOfText;
                sqlStartIndex = lineIndex;
            }
        } else {
            const lineOfText = doc.lineAt(lineIndex);
            let endStr = '-';
            if (lineOfText.text.includes('`')) {
                endStr = '`'
            } else if (lineOfText.text.includes('"')) {
                endStr = '"'
            } else if (lineOfText.text.includes('"""')) {
                endStr = '"""'
            }
            if (endStr != '-') {
                const subDiagnostics = await checkRange(doc, sqlStartLine, sqlStartIndex, lineOfText, lineIndex, endStr);
                diagnostics.push(...subDiagnostics)
                sqlStartIndex = -1;
            }
        }
    }

    emojiDiagnostics.set(doc.uri, diagnostics);
}

async function checkRange(
    doc: vscode.TextDocument,
    lineOfTextStart: vscode.TextLine,
    lineIndexStart: number,
    lineOfTextEnd: vscode.TextLine,
    lineIndexEnd: number,
    endStr: string,
): Promise<vscode.Diagnostic[]> {
    const diagnostics: vscode.Diagnostic[] = [];

    const indexStart = lineOfTextStart.text.indexOf(SQL_FLAG);
    const indexEnd = lineOfTextEnd.text.indexOf(endStr);

    const range = new vscode.Range(lineIndexStart, indexStart, lineIndexEnd, indexEnd);
    const sqlStr = doc.getText(range)
    // const diagnostic = new vscode.Diagnostic(range, sqlStr, vscode.DiagnosticSeverity.Error);
    // diagnostics.push(diagnostic)


    const errors = await sqlLint({
        sql: sqlStr,
        // driver: 'postgres',
    })
    for (const error of errors) {
        const diagnostic = new vscode.Diagnostic(range, error.error,
            vscode.DiagnosticSeverity.Error);
        diagnostics.push(diagnostic)
    }

    return diagnostics;
}

export async function subscribeToDocumentChanges(
    context: vscode.ExtensionContext,
    emojiDiagnostics: vscode.DiagnosticCollection,
): Promise<void> {
    if (vscode.window.activeTextEditor) {
        await refreshDiagnostics(vscode.window.activeTextEditor.document, emojiDiagnostics);
    }
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                refreshDiagnostics(editor.document, emojiDiagnostics);
            }
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(e => refreshDiagnostics(e.document, emojiDiagnostics))
    );

    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument(doc => emojiDiagnostics.delete(doc.uri))
    );
}
