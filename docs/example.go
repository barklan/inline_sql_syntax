package main

import "fmt"

func main() {
	query := `--sql
select * from book;
`
	fmt.Println(query)
}
