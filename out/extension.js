'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeToDocumentChanges = exports.refreshDiagnostics = exports.activate = exports.SQL_FLAG = void 0;
/** To demonstrate code actions associated with Diagnostics problems, this file provides a mock diagnostics entries. */
const vscode = require("vscode");
const sql_lint_1 = require("sql-lint");
/** String to detect in the text document. */
exports.SQL_FLAG = '--sql';
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
async function activate(context) {
    const emojiDiagnostics = vscode.languages.createDiagnosticCollection("emoji");
    context.subscriptions.push(emojiDiagnostics);
    await subscribeToDocumentChanges(context, emojiDiagnostics);
}
exports.activate = activate;
/**
 * Analyzes the text document for problems.
 * This demo diagnostic problem provider finds all mentions of 'emoji'.
 * @param doc text document to analyze
 * @param emojiDiagnostics diagnostic collection
 */
async function refreshDiagnostics(doc, emojiDiagnostics) {
    let diagnostics = [];
    let sqlStartLine = doc.lineAt(0);
    let sqlStartIndex = -1;
    for (let lineIndex = 0; lineIndex < doc.lineCount; lineIndex++) {
        if (sqlStartIndex == -1) {
            const lineOfText = doc.lineAt(lineIndex);
            if (lineOfText.text.includes(exports.SQL_FLAG)) {
                sqlStartLine = lineOfText;
                sqlStartIndex = lineIndex;
            }
        }
        else {
            const lineOfText = doc.lineAt(lineIndex);
            let endStr = '-';
            if (lineOfText.text.includes('`')) {
                endStr = '`';
            }
            else if (lineOfText.text.includes('"')) {
                endStr = '"';
            }
            else if (lineOfText.text.includes('"""')) {
                endStr = '"""';
            }
            if (endStr != '-') {
                const subDiagnostics = await checkRange(doc, sqlStartLine, sqlStartIndex, lineOfText, lineIndex, endStr);
                diagnostics.push(...subDiagnostics);
                sqlStartIndex = -1;
            }
        }
    }
    emojiDiagnostics.set(doc.uri, diagnostics);
}
exports.refreshDiagnostics = refreshDiagnostics;
async function checkRange(doc, lineOfTextStart, lineIndexStart, lineOfTextEnd, lineIndexEnd, endStr) {
    const diagnostics = [];
    const indexStart = lineOfTextStart.text.indexOf(exports.SQL_FLAG);
    const indexEnd = lineOfTextEnd.text.indexOf(endStr);
    const range = new vscode.Range(lineIndexStart, indexStart, lineIndexEnd, indexEnd);
    const sqlStr = doc.getText(range);
    // const diagnostic = new vscode.Diagnostic(range, sqlStr, vscode.DiagnosticSeverity.Error);
    // diagnostics.push(diagnostic)
    const errors = await (0, sql_lint_1.default)({
        sql: sqlStr,
        // driver: 'postgres',
    });
    for (const error of errors) {
        const diagnostic = new vscode.Diagnostic(range, error.error, vscode.DiagnosticSeverity.Error);
        diagnostics.push(diagnostic);
    }
    return diagnostics;
}
async function subscribeToDocumentChanges(context, emojiDiagnostics) {
    if (vscode.window.activeTextEditor) {
        await refreshDiagnostics(vscode.window.activeTextEditor.document, emojiDiagnostics);
    }
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            refreshDiagnostics(editor.document, emojiDiagnostics);
        }
    }));
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => refreshDiagnostics(e.document, emojiDiagnostics)));
    context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(doc => emojiDiagnostics.delete(doc.uri)));
}
exports.subscribeToDocumentChanges = subscribeToDocumentChanges;
//# sourceMappingURL=extension.js.map