'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeToDocumentChanges = exports.refreshDiagnostics = exports.activate = exports.PY_SQL = exports.QUOTE_SQL = exports.BACKTICK_SQL = exports.SQL_FLAG = void 0;
const vscode = require("vscode");
const sql_lint_1 = require("sql-lint");
exports.SQL_FLAG = '--sql';
exports.BACKTICK_SQL = '`' + exports.SQL_FLAG;
exports.QUOTE_SQL = '"' + exports.SQL_FLAG;
exports.PY_SQL = '"""' + exports.SQL_FLAG;
async function activate(context) {
    const emojiDiagnostics = vscode.languages.createDiagnosticCollection("emoji");
    context.subscriptions.push(emojiDiagnostics);
    await subscribeToDocumentChanges(context, emojiDiagnostics);
}
exports.activate = activate;
async function refreshDiagnostics(doc, emojiDiagnostics) {
    let diagnostics = [];
    let sqlStartLine = doc.lineAt(0);
    let sqlStringBound = "";
    let sqlStartIndex = -1;
    for (let lineIndex = 0; lineIndex < doc.lineCount; lineIndex++) {
        if (sqlStartIndex == -1) {
            const lineOfText = doc.lineAt(lineIndex);
            if (lineOfText.text.includes(exports.BACKTICK_SQL)) {
                sqlStartLine = lineOfText;
                sqlStringBound = '`';
                sqlStartIndex = lineIndex;
            }
            else if (lineOfText.text.includes(exports.QUOTE_SQL)) {
                sqlStartLine = lineOfText;
                sqlStringBound = '"';
                sqlStartIndex = lineIndex;
            }
            else if (lineOfText.text.includes(exports.PY_SQL)) {
                sqlStartLine = lineOfText;
                sqlStringBound = '"""';
                sqlStartIndex = lineIndex;
            }
        }
        else if (sqlStringBound != "") {
            const lineOfText = doc.lineAt(lineIndex);
            if (lineOfText.text.includes(sqlStringBound)) {
                const subDiagnostics = await checkRange(doc, sqlStartLine, sqlStartIndex, lineOfText, lineIndex, sqlStringBound);
                diagnostics.push(...subDiagnostics);
                sqlStartIndex = -1;
                sqlStringBound = "";
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