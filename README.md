# Inline SQL ![shield](https://img.shields.io/visual-studio-marketplace/i/qufiwefefwoyn.inline-sql-syntax)

> Also available in [Open VSX Registry](https://open-vsx.org/extension/qufiwefefwoyn/inline-sql-syntax)

![python](docs/py_lint.png)

Highlight and lint inline SQL strings.
Supported languages are **Python**, **Go**, **JavaScript**, **TypeScript**, **Ruby**, **Java**, **C#**, **Rust**, **PHP**, **Lua**.

Syntax highlighting works for strings starting with `--sql` or any of
the `SELECT`, `INSERT`, `INTO`, `DELETE`, `UPDATE`, `CREATE TABLE`.

Also works with ES6 Template Strings:

```javascript
const query = sql`
    select * from book;
`;
```

**Linting and diagnostics powered entirely by awesome
[joereynolds/sql-lint](https://github.com/joereynolds/sql-lint) and works for
multiline strings that start with either <code>\`--sql</code> (backtick followed by `--sql`),
`"--sql` or `"""--sql`.**

## Contributors

<!-- readme: contributors -start -->
<table>
<tr>
    <td align="center">
        <a href="https://github.com/barklan">
            <img src="https://avatars.githubusercontent.com/u/71007493?v=4" width="100;" alt="barklan"/>
            <br />
            <sub><b>Gleb Buzin</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/Wild-W">
            <img src="https://avatars.githubusercontent.com/u/39774593?v=4" width="100;" alt="Wild-W"/>
            <br />
            <sub><b>Connor Bren</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/tamasfe">
            <img src="https://avatars.githubusercontent.com/u/25967296?v=4" width="100;" alt="tamasfe"/>
            <br />
            <sub><b>Ferenc Tamás</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/nossrannug">
            <img src="https://avatars.githubusercontent.com/u/416906?v=4" width="100;" alt="nossrannug"/>
            <br />
            <sub><b>Gunnar Sv Sigurbjörnsson</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/JonathanWolfe">
            <img src="https://avatars.githubusercontent.com/u/1449779?v=4" width="100;" alt="JonathanWolfe"/>
            <br />
            <sub><b>Jon Wolfe</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/titouancreach">
            <img src="https://avatars.githubusercontent.com/u/3995719?v=4" width="100;" alt="titouancreach"/>
            <br />
            <sub><b>Titouan CREACH</b></sub>
        </a>
    </td></tr>
</table>
<!-- readme: contributors -end -->

## Safety

The proper way to sanitize data for insertion into your database is to
use placeholders for all variables to be inserted into your SQL strings.
In other words, NEVER do this (Python example):

```python
query = f"INSERT INTO foo (bar, baz) VALUES ( {variable1}, {variable2} )";
```

Instead, use `$` placeholders (or `?` in some databases):

```python
query = "INSERT INTO foo (bar, baz) VALUES ( $1, $2  )";
```

And then pass the variables to be replaced when you execute the query.
For example with [pgx](https://github.com/JackC/pgx) (Go example):

```go
err = conn.QueryRow(
    context.Background(),
    "select name, weight from widgets where id=$1",
    42,
).Scan(&name, &weight)
```

## Integration with real database

Integration with real database is available and controlled through VSCode options:

```json
{
    "inlineSQL.enableDBIntegration": true,
    "inlineSQL.dbDriver": "postgres",
    "inlineSQL.dbHost": "localhost",
    "inlineSQL.dbPort": 5432,
    "inlineSQL.dbUser": "postgres",
    "inlineSQL.dbPassword": "postgres"
}
```

## Examples

### Python

![python](docs/py_lint.png)

### JavaScript/TypeScript

![js](docs/js_lint.png)

### Go

![go](docs/go_lint.png)

![go](docs/go_lint2.png)

<table style="width:100%; border: none!important;">
  <tr>
    <td>Python</td>
    <td>JavaScript/TypeScript</td>
  </tr>
  <tr>
    <td><img src="docs/python.png" /></td>
    <td><img src="docs/js.png" /></td>
  </tr>
</table>

<table style="width:100%; border: none!important;">
  <tr>
    <td>Ruby</td>
    <td>Java</td>
  </tr>
  <tr>
    <td><img src="docs/ruby.png" /></td>
    <td><img src="docs/java.png" /></td>
  </tr>
</table>

## Limitations

### Semantic highlighting

Highlighting does not work with semantic token highlighting enabled (feature provided by some LSP servers).

Currently gopls semantic token highlighting (option `gopls.ui.semanticTokens` - off by default)
overrides extension's syntax.

#### gopls

```json
{
    "gopls.ui.semanticTokens": false
}
```

#### rust-analyzer

```json
{
    "rust-analyzer.highlighting.strings": false
}
```

#### `C#`

```json
{
    "csharp.semanticHighlighting.enabled": false
}
```

## Motivation

This small extension is meant to help those who don't use ORM and don't like SQL builders
like [squirrel](https://github.com/Masterminds/squirrel),
but still want inline sql in their code to be something more than magic strings,
helping to avoid small bugs and typos almost instantly.

## Related

- [joereynolds/sql-lint](https://github.com/joereynolds/sql-lint) - Used for linting.
- [joe-re/sql-language-server](https://github.com/joe-re/sql-language-server) - SQL Language Server, consider it if you use separate files for sql.
- [cmoog/vscode-sql-notebook](https://github.com/cmoog/vscode-sql-notebook) - Open SQL files as VSCode Notebooks.
- [pushqrdx/vscode-inline-html](https://github.com/pushqrdx/vscode-inline-html) - ES6 Template Strings inline HTML.
