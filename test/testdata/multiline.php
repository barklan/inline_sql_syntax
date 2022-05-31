$query = <<<SQL
    SELECT * FROM book WHERE FOO.bar = '1';
SQL;

$notQuery = "This is not a query, test: SELECT"
