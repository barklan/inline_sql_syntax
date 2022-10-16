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
SELECT This a query and should be considered
as one even though --sql comment is not present.
Also, I hate manual testing.;
`

	notQuery2 := `
		this is really not a query, but we do demonstrate the only known issue
		with this approach, where an in-string sql keyword will make the sql injection
		mis-fire.
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

	more6 := `
		SELECT * from book;
	`

	more7 := `
		with hihi as (

		)
	`

	print(query, another, more, notQuery, notQuery2, more2, more3, more4, more5, more6, more7)
}

func add(a, b int) int {
	return a + b
}
