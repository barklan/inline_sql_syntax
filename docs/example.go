package main

import "fmt"

func main() {
	query := `--sql
select * from book;
`
	fmt.Println(query)

	another := `SELECT * from book`
	fmt.Println(another)
}
