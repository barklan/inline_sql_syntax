import * as vscode from 'vscode';
import sqlLint from 'sql-lint';
import * as configuration from './configuration';

export const SQL_FLAG = /-- ?sql/g;
export const BACKTICK_SQL = '`--';
export const QUOTE_SQL = '"--';
// export const PY_SQL = `"""${SQL_FLAG}`;

async function checkRange(
    log: vscode.OutputChannel,
    doc: vscode.TextDocument,
    lineOfTextStart: vscode.TextLine,
    lineIndexStart: number,
    lineOfTextEnd: vscode.TextLine,
    lineIndexEnd: number,
    endStr: string,
): Promise<vscode.Diagnostic[]> {
    const diagnostics: vscode.Diagnostic[] = [];

    let endChar = lineIndexEnd.toExponential.length - 1;
    if (endChar === -1) {
        endChar = 0;
    }
    let range = new vscode.Range(lineIndexStart, 0, lineIndexEnd, endChar);

    let sqlStr = '';
    if (endStr === 'eof') {
        sqlStr = doc.getText();
    } else {
        const lineStr = lineOfTextStart.text;
        const reSearch = SQL_FLAG.exec(lineStr);
        let indexStart = 0;
        if (reSearch === null) {
            log.appendLine('something went wrong');
            return diagnostics;
        }
        indexStart = reSearch.index;
        const indexEnd = lineOfTextEnd.text.indexOf(endStr);
        range = new vscode.Range(lineIndexStart, indexStart, lineIndexEnd, indexEnd);
        sqlStr = doc.getText(range);
    }

    let errors = null;
    log.appendLine(`linting sql: ${sqlStr}`);
    if (configuration.get<boolean>('enableDBIntegration')) {
        try {
            log.appendLine('linting sql using live database');
            errors = await sqlLint({
                sql: sqlStr,
                driver: configuration.get<string>('dbDriver'),
                host: configuration.get<string>('dbHost'),
                port: configuration.get<number>('dbPort'),
                user: configuration.get<string>('dbUser'),
                password: configuration.get<string>('dbPassword'),
            });
            log.appendLine(`${errors.length} errors found`);
        } catch {
            log.appendLine('failed to make database request');
        }
    } else {
        errors = await sqlLint({ sql: sqlStr });
        log.appendLine(`${errors.length} errors found`);
    }

    if (errors != null) {
        for (let i = 0; i < errors.length; i += 1) {
            const diagnostic = new vscode.Diagnostic(
                range,
                errors[i].error,
                vscode.DiagnosticSeverity.Error,
            );
            diagnostics.push(diagnostic);
        }
    }

    return diagnostics;
}

export async function refreshDiagnostics(
    doc: vscode.TextDocument,
    inlinesqlDiagnostics: vscode.DiagnosticCollection,
    log: vscode.OutputChannel,
): Promise<void> {
    const diagnostics: vscode.Diagnostic[] = [];

    let sqlStartLine = doc.lineAt(0);
    let sqlStringBound = '';
    let sqlStartIndex = -1;

    if (configuration.get<boolean>('lintSQLFiles') && doc.languageId === 'sql') {
        sqlStringBound = 'eof';
        sqlStartIndex = 0;
        const lastLine = doc.lineAt(doc.lineCount - 1);
        const subDiagnostics = await checkRange(
            log,
            doc,
            sqlStartLine,
            sqlStartIndex,
            lastLine,
            doc.lineCount - 1,
            sqlStringBound,
        );
        diagnostics.push(...subDiagnostics);

        inlinesqlDiagnostics.set(doc.uri, diagnostics);
        return;
    }

    let sqlStringCnt = 0;
    for (let lineIndex = 0; lineIndex < doc.lineCount; lineIndex += 1) {
        if (sqlStartIndex === -1) {
            const lineOfText = doc.lineAt(lineIndex);
            if (lineOfText.text.includes(BACKTICK_SQL)) {
                sqlStartLine = lineOfText;
                sqlStringBound = '`';
                sqlStartIndex = lineIndex;
            } else if (lineOfText.text.includes(QUOTE_SQL)) {
                sqlStartLine = lineOfText;
                sqlStringBound = '"';
                sqlStartIndex = lineIndex;
            // } else if (lineOfText.text.includes(PY_SQL)) {
            //     sqlStartLine = lineOfText;
            //     sqlStringBound = '"""';
            //     sqlStartIndex = lineIndex;
            }
        } else if (sqlStringBound !== '') {
            const lineOfText = doc.lineAt(lineIndex);
            if (lineOfText.text.includes(sqlStringBound)) {
                sqlStringCnt += 1;
                const subDiagnostics = await checkRange( // eslint-disable-line no-await-in-loop
                    log,
                    doc,
                    sqlStartLine,
                    sqlStartIndex,
                    lineOfText,
                    lineIndex,
                    sqlStringBound,
                );
                diagnostics.push(...subDiagnostics);
                sqlStartIndex = -1;
                sqlStringBound = '';
            }
        }
    }
    const now = new Date().toISOString();
    if (sqlStringBound !== '') {
        log.appendLine(`${now}: SQL string was not closed.`);
    }
    log.appendLine(`${now}: ${sqlStringCnt} SQL strings found and linted`);

    inlinesqlDiagnostics.set(doc.uri, diagnostics);
}

export async function subscribeToDocumentChanges(
    context: vscode.ExtensionContext,
    inlinesqlDiagnostics: vscode.DiagnosticCollection,
    log: vscode.OutputChannel,
): Promise<void> {
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor) {
                refreshDiagnostics(editor.document, inlinesqlDiagnostics, log);
            }
        }),
    );

    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(
            (e) => {
                const now = new Date().toISOString();
                log.appendLine(`${now}: document saved, refreshing diagnostics`);
                refreshDiagnostics(e, inlinesqlDiagnostics, log);
            },
        ),
    );

    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument((doc) => inlinesqlDiagnostics.delete(doc.uri)),
    );
    log.appendLine('watching active editors');
}

export async function activate(context: vscode.ExtensionContext) {
    const inlinesqlDiagnostics = vscode.languages.createDiagnosticCollection('inlinesql');
    context.subscriptions.push(inlinesqlDiagnostics);

    const log = vscode.window.createOutputChannel('Inline SQL');
    log.appendLine('inline SQL activated');

    await subscribeToDocumentChanges(context, inlinesqlDiagnostics, log);
}
