'use strict';
import * as vscode from 'vscode';
import sqlLint from 'sql-lint';
import * as configuration from './configuration';

export const SQL_FLAG = '--sql';
export const BACKTICK_SQL = '`' + SQL_FLAG
export const QUOTE_SQL = '"' + SQL_FLAG
export const PY_SQL = '"""' + SQL_FLAG

export async function activate(context: vscode.ExtensionContext) {
    const inlinesqlDiagnostics = vscode.languages.createDiagnosticCollection("inlinesql");
    context.subscriptions.push(inlinesqlDiagnostics);

    await subscribeToDocumentChanges(context, inlinesqlDiagnostics);
}

export async function refreshDiagnostics(
    doc: vscode.TextDocument,
    inlinesqlDiagnostics: vscode.DiagnosticCollection
): Promise<void> {
    let diagnostics: vscode.Diagnostic[] = [];

    let sqlStartLine = doc.lineAt(0);
    let sqlStringBound = "";
    let sqlStartIndex = -1;
    for (let lineIndex = 0; lineIndex < doc.lineCount; lineIndex++) {
        if (sqlStartIndex == -1) {
            const lineOfText = doc.lineAt(lineIndex);
            if (lineOfText.text.includes(BACKTICK_SQL)) {
                sqlStartLine = lineOfText;
                sqlStringBound = '`';
                sqlStartIndex = lineIndex;
            } else if (lineOfText.text.includes(QUOTE_SQL)) {
                sqlStartLine = lineOfText;
                sqlStringBound = '"';
                sqlStartIndex = lineIndex;
            } else if (lineOfText.text.includes(PY_SQL)) {
                sqlStartLine = lineOfText;
                sqlStringBound = '"""';
                sqlStartIndex = lineIndex;
            }
        } else if (sqlStringBound != "") {
            const lineOfText = doc.lineAt(lineIndex);
            if (lineOfText.text.includes(sqlStringBound)) {
                const subDiagnostics = await checkRange(
                    doc,
                    sqlStartLine,
                    sqlStartIndex,
                    lineOfText,
                    lineIndex,
                    sqlStringBound,
                );
                diagnostics.push(...subDiagnostics)
                sqlStartIndex = -1;
                sqlStringBound = "";
            }
        }
    }

    inlinesqlDiagnostics.set(doc.uri, diagnostics);
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

    let errors = null
    if (configuration.get<boolean>('enableDBIntegration')) {
        try {
            errors = await sqlLint({
                sql: sqlStr,
                driver: configuration.get<string>('dbDriver'),
                host: configuration.get<string>('dbHost'),
                port: configuration.get<number>('dbPort'),
                user: configuration.get<string>('dbUser'),
                password: configuration.get<string>('dbPassword'),
            })
        }
        catch {
            vscode.window.showInformationMessage('InlineSQL failed to make request to database.');
        }
    } else {
        errors = await sqlLint({ sql: sqlStr })
    }

    if (errors != null) {
        for (const error of errors) {
            const diagnostic = new vscode.Diagnostic(range, error.error,
                vscode.DiagnosticSeverity.Error);
            diagnostics.push(diagnostic)
        }
    }

    return diagnostics;
}

export async function subscribeToDocumentChanges(
    context: vscode.ExtensionContext,
    inlinesqlDiagnostics: vscode.DiagnosticCollection,
): Promise<void> {
    if (vscode.window.activeTextEditor) {
        await refreshDiagnostics(vscode.window.activeTextEditor.document, inlinesqlDiagnostics);
    }
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                refreshDiagnostics(editor.document, inlinesqlDiagnostics);
            }
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(e => refreshDiagnostics(e.document, inlinesqlDiagnostics))
    );

    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument(doc => inlinesqlDiagnostics.delete(doc.uri))
    );
}
