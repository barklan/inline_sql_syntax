'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeToDocumentChanges = exports.refreshDiagnostics = exports.activate = exports.PY_SQL = exports.QUOTE_SQL = exports.BACKTICK_SQL = exports.SQL_FLAG = void 0;
const vscode = require("vscode");
const sql_lint_1 = require("sql-lint");
const configuration = require("./configuration");
exports.SQL_FLAG = '--sql';
exports.BACKTICK_SQL = '`' + exports.SQL_FLAG;
exports.QUOTE_SQL = '"' + exports.SQL_FLAG;
exports.PY_SQL = '"""' + exports.SQL_FLAG;
async function activate(context) {
    const inlinesqlDiagnostics = vscode.languages.createDiagnosticCollection("inlinesql");
    context.subscriptions.push(inlinesqlDiagnostics);
    await subscribeToDocumentChanges(context, inlinesqlDiagnostics);
}
exports.activate = activate;
async function refreshDiagnostics(doc, inlinesqlDiagnostics) {
    let diagnostics = [];
    let sqlStartLine = doc.lineAt(0);
    let sqlStringBound = "";
    let sqlStartIndex = -1;
    if (configuration.get('lintSQLFiles') && doc.languageId == 'sql') {
        sqlStringBound = 'eof';
        sqlStartIndex = 0;
        var lastLine = doc.lineAt(doc.lineCount - 1);
        const subDiagnostics = await checkRange(doc, sqlStartLine, sqlStartIndex, lastLine, doc.lineCount - 1, sqlStringBound);
        diagnostics.push(...subDiagnostics);
        inlinesqlDiagnostics.set(doc.uri, diagnostics);
        return;
    }
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
    inlinesqlDiagnostics.set(doc.uri, diagnostics);
}
exports.refreshDiagnostics = refreshDiagnostics;
async function checkRange(doc, lineOfTextStart, lineIndexStart, lineOfTextEnd, lineIndexEnd, endStr) {
    const diagnostics = [];
    let endChar = lineIndexEnd.toExponential.length - 1;
    if (endChar == -1) {
        endChar = 0;
    }
    const range = new vscode.Range(lineIndexStart, 0, lineIndexEnd, endChar);
    var sqlStr = '';
    if (endStr == 'eof') {
        sqlStr = doc.getText();
    }
    else {
        let indexStart = lineOfTextStart.text.indexOf(exports.SQL_FLAG);
        let indexEnd = lineOfTextEnd.text.indexOf(endStr);
        const range = new vscode.Range(lineIndexStart, indexStart, lineIndexEnd, indexEnd);
        sqlStr = doc.getText(range);
    }
    let errors = null;
    if (configuration.get('enableDBIntegration')) {
        try {
            errors = await (0, sql_lint_1.default)({
                sql: sqlStr,
                driver: configuration.get('dbDriver'),
                host: configuration.get('dbHost'),
                port: configuration.get('dbPort'),
                user: configuration.get('dbUser'),
                password: configuration.get('dbPassword'),
            });
        }
        catch {
            vscode.window.showInformationMessage('InlineSQL failed to make request to database.');
        }
    }
    else {
        errors = await (0, sql_lint_1.default)({ sql: sqlStr });
    }
    if (errors != null) {
        for (const error of errors) {
            const diagnostic = new vscode.Diagnostic(range, error.error, vscode.DiagnosticSeverity.Error);
            diagnostics.push(diagnostic);
        }
    }
    return diagnostics;
}
async function subscribeToDocumentChanges(context, inlinesqlDiagnostics) {
    if (vscode.window.activeTextEditor) {
        await refreshDiagnostics(vscode.window.activeTextEditor.document, inlinesqlDiagnostics);
    }
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            refreshDiagnostics(editor.document, inlinesqlDiagnostics);
        }
    }));
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => refreshDiagnostics(e.document, inlinesqlDiagnostics)));
    context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(doc => inlinesqlDiagnostics.delete(doc.uri)));
}
exports.subscribeToDocumentChanges = subscribeToDocumentChanges;
//# sourceMappingURL=extension.js.map