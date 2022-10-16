package main

func main() {
	// On live DB error should be:
	// [error] relation "book" does not exist
	query := `--sql
select * from book where id = 34;
`

	another := `--sql
select * from book where id = 34;
`

	notQuery := `
SELECT This is not a query and should not be considered
as one as --sql comment is not present.
Also, I hate manual testing.;
`

	more := `--sql
	select * from book where id = 34;
`

	more2 := `
--sql
select * from book where id = 34;
`

	more3 := `--sql; select * from book;`

	more4 := `select * from book;`

	more5 := `SELECT * from book;`

	print(query, another, more, notQuery, more2, more3, more4, more5)
}

func add(a, b int) int {
	return a + b
}
