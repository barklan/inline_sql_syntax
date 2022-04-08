$query = <<<SQL
    SELECT * FROM FOO WHERE FOO.bar = '1'
SQL;

$notQuery = "This is not a query, test: SELECT"
