import * as vscode from 'vscode';
import * as assert from 'assert';
import { getDocUri, activate } from './helper';

suite('Should get diagnostics', () => {
const docUri = getDocUri('multiline.go');

test('checks diagnostics', async () => {
	await testDiagnostics(docUri, [
		{
			message: '[Error] connect ECONNREFUSED 127.0.0.1:5432',
			range: toRange(5, 13, 7, 0),
			severity: vscode.DiagnosticSeverity.Error,
			// source: 'ex'
		}
		// {
		// 	message: 'DB is live',
		// 	range: toRange(0, 14, 0, 17),
		// 	severity: vscode.DiagnosticSeverity.Warning,
		// 	source: 'ex'
		// }
	]);
});
});

function toRange(sLine: number, sChar: number, eLine: number, eChar: number) {
const start = new vscode.Position(sLine, sChar);
const end = new vscode.Position(eLine, eChar);
return new vscode.Range(start, end);
}

async function testDiagnostics(docUri: vscode.Uri, expectedDiagnostics: vscode.Diagnostic[]) {
await activate(docUri);

const actualDiagnostics = vscode.languages.getDiagnostics(docUri);

assert.equal(actualDiagnostics.length, expectedDiagnostics.length);

expectedDiagnostics.forEach((expectedDiagnostic, i) => {
	const actualDiagnostic = actualDiagnostics[i];
	assert.equal(actualDiagnostic.message, expectedDiagnostic.message);
	assert.deepEqual(actualDiagnostic.range, expectedDiagnostic.range);
	assert.equal(actualDiagnostic.severity, expectedDiagnostic.severity);
});
}
