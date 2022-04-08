package main

func main() {
	// On live DB error should be:
	// [error] relation "book" does not exist
	query := `--sql
select * from book where id = 34;
`

	another := `--sql
 * from book where id = 34;
`

	notQuery := `
SELECT This is not a query and should not be considered
as one as --sql comment is not present.
Also, I hate manual testing.;
`
	print(query, another, notQuery)
}
