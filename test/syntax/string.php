$this->createAndInsertValue(
    "CREATE TABLE test (id INT NOT NULL AUTO_INCREMENT, data VARCHAR (50) NOT NULL, PRIMARY KEY (id))",
    "INSERT INTO test (data) VALUES('Hello World')"
);
