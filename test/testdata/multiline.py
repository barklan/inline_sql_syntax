query = """--sql
    SELECT 'id', 'name', 'age' FROM book;
"""

another = """--sql
    delete * from book;
"""

query_with_db_identifiers = """--sql
    delete * from "book";
"""

some_table = "book"
f_string = f"""--sql
select * from {some_table}
"""
