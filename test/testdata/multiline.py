query = """--sql
    SELECT 'id', 'name', 'age' FROM book;
"""

another = """--sql
    delete * from book;
"""

query_with_db_identifiers = """--sql
    delete * from "book";
"""
