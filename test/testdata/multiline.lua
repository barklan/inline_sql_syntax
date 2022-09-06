local testQuery = [=[--sql
    SELECT * FROM employees WHERE [First Name] = "Jared";
]=]

local testQuery2 = [[INSERT INTO locations (x, y, locationName) VALUES (20, 43, "Monument")]]