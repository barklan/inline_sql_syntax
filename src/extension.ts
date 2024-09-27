import * as vscode from 'vscode';
import sqlLint from 'sql-lint';
import * as configuration from './configuration';

export const PHP_SQL = '<<<SQL';
export const SQL_START_REGEX =
    /(?<token>r(?<hashes>#*)?"|"""|"|'''|'|`)--\s*sql/;

async function checkRange(
    log: vscode.OutputChannel,
    doc: vscode.TextDocument,
    range: vscode.Range,
): Promise<vscode.Diagnostic[]> {
    const diagnostics: vscode.Diagnostic[] = [];

    const sqlStr = doc.getText(range);

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

    let startRangePosition = -1;
    let sqlStringBound = '';
    let sqlStartLineIndex = -1;
    let hashes = ''; // For Rust raw strings

    if (
        configuration.get<boolean>('lintSQLFiles') &&
        doc.languageId === 'sql'
    ) {
        const lastLineIndex = doc.lineCount - 1;
        const lastLine = doc.lineAt(lastLineIndex);

        const range = new vscode.Range(
            0,
            0,
            lastLineIndex,
            lastLine.text.length,
        );
        const subDiagnostics = await checkRange(log, doc, range);
        diagnostics.push(...subDiagnostics);

        inlinesqlDiagnostics.set(doc.uri, diagnostics);
        return;
    }
    let match;
    let phpPatternStart = -1;
    let sqlStringCnt = 0;
    for (let lineIndex = 0; lineIndex < doc.lineCount; lineIndex += 1) {
        let lineOfText = doc.lineAt(lineIndex).text;
        if (sqlStartLineIndex === -1) {
            if ((match = SQL_START_REGEX.exec(lineOfText)) !== null) {
                startRangePosition = match.index + match.groups!.token.length;
                sqlStartLineIndex = lineIndex;
                if (match.groups!.hashes !== undefined) {
                    hashes = match.groups!.hashes;
                    sqlStringBound = `"${hashes}`;
                } else {
                    sqlStringBound = match.groups!.token;
                }
            } else if ((phpPatternStart = lineOfText.indexOf(PHP_SQL)) !== -1) {
                startRangePosition = phpPatternStart + PHP_SQL.length;
                sqlStringBound = 'SQL;';
                sqlStartLineIndex = lineIndex;
            }
        }
        if (sqlStringBound !== '') {
            let endSqlIndex = -1;
            if (lineIndex === sqlStartLineIndex) {
                endSqlIndex = lineOfText.indexOf(
                    sqlStringBound,
                    startRangePosition,
                );
            } else {
                endSqlIndex = lineOfText.indexOf(sqlStringBound);
            }
            if (endSqlIndex !== -1) {
                sqlStringCnt += 1;
                const range = new vscode.Range(
                    sqlStartLineIndex,
                    startRangePosition,
                    lineIndex,
                    endSqlIndex,
                );
                const subDiagnostics = await checkRange(log, doc, range);
                diagnostics.push(...subDiagnostics);
                sqlStartLineIndex = -1;
                sqlStringBound = '';
                hashes = '';
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
        vscode.workspace.onDidSaveTextDocument((e) => {
            const now = new Date().toISOString();
            log.appendLine(`${now}: document saved, refreshing diagnostics`);
            refreshDiagnostics(e, inlinesqlDiagnostics, log);
        }),
    );

    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument((doc) =>
            inlinesqlDiagnostics.delete(doc.uri),
        ),
    );
    log.appendLine('watching active editors');
}

export async function activate(context: vscode.ExtensionContext) {
    const inlinesqlDiagnostics =
        vscode.languages.createDiagnosticCollection('inlinesql');
    context.subscriptions.push(inlinesqlDiagnostics);

    const log = vscode.window.createOutputChannel('Inline SQL');
    log.appendLine('inline SQL activated');

    await subscribeToDocumentChanges(context, inlinesqlDiagnostics, log);
}
