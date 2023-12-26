-- name: InsertCity :one
INSERT INTO city (name) VALUES (@name) ON CONFLICT(name) DO NOTHING RETURNING *;

-- name: GetCity :one
SELECT * FROM city WHERE name = @name;

-- name: ListCities :many
SELECT name FROM city;

-- name: InsertSection :one
INSERT INTO section (name, city_id) VALUES (@name, @city_id) ON CONFLICT(name, city_id) DO NOTHING RETURNING *;

-- name: GetSection :one
SELECT * FROM section WHERE name = @name;

-- name: ListSectionByCity :many
SELECT section.name FROM section INNER JOIN city ON (city.id = section.city_id) WHERE city.name = @name ORDER BY section.name;

-- name: InsertShape :one
INSERT INTO shape (name) VALUES (@name) ON CONFLICT(name) DO NOTHING RETURNING *;

-- name: GetShape :one
SELECT * FROM shape WHERE name = @name;

-- name: ListShape :many
SELECT name FROM shape WHERE name != '' ORDER BY name;

-- name: Upserthouse :exec
INSERT INTO house (section_id, link, layout, address, price, floor, shape_id, age, area, main_area, raw, others ,created_at, updated_at)
VALUES (@section_id, @link, @layout, @address, @price, @floor, @shape_id, @age, @area, @main_area, @raw, @others ,CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (link) DO UPDATE SET price = @price, raw = @raw, age = @age, updated_at = CURRENT_TIMESTAMP;

-- name: Gethouses :many
WITH duplicate_conditions AS (
    SELECT MIN(id) AS id, section_id, address, age, area
    FROM house
    WHERE link LIKE 'https://sale.591.com.tw/home%'
    AND updated_at > CURRENT_TIMESTAMP - INTERVAL '7 day'
    GROUP BY section_id, address, age, area
    HAVING count(1) > 1
),
duplicate AS (
    SELECT house.id
    FROM house
    INNER JOIN duplicate_conditions ON(
            house.section_id = duplicate_conditions.section_id
        AND house.address = duplicate_conditions.address
        AND house.age = duplicate_conditions.age
        AND house.area = duplicate_conditions.area
        AND house.link LIKE 'https://sale.591.com.tw/home%'
    )
    WHERE house.id NOT IN (SELECT id FROM duplicate_conditions)
    AND house.updated_at > CURRENT_TIMESTAMP - INTERVAL '7 day'
),
candidates AS (
SELECT house.id
FROM house
INNER JOIN section ON(house.section_id = section.id)
INNER JOIN city ON(section.city_id = city.id)
INNER JOIN shape ON(house.shape_id = shape.id)
WHERE house.updated_at > CURRENT_TIMESTAMP - INTERVAL '7 day'
    AND house.id NOT IN (SELECT id FROM duplicate)
    AND (COALESCE(@city, '') = '' OR city.name = ANY(string_to_array(@city, ',')))
    AND (COALESCE(@section, '') = '' OR section.name = ANY(string_to_array(@section, ',')))
    AND (COALESCE(@shape, '') = '' OR shape.name LIKE ANY(string_to_array(@shape, ',')))
    AND (COALESCE(@max_price, '') = '' OR house.price <= @max_price :: DECIMAL)
    AND (COALESCE(@min_price, '') = '' OR house.price > @min_price :: DECIMAL)
    AND (COALESCE(@age, '') = '' OR house.age < @age)
    AND (COALESCE(@max_main_area, '') = '' OR house.main_area <= @max_main_area :: DECIMAL)
    AND (COALESCE(@min_main_area, '') = '' OR house.main_area > @min_main_area :: DECIMAL)
)
SELECT
    house.*,
    CONCAT(city.name, section.name, house.address) :: VARCHAR AS location,
    city.name :: TEXT AS city,
    section.name :: TEXT AS section,
    shape.name :: TEXT AS shape,
    (SELECT COUNT(1) FROM candidates) AS total_count
FROM house
INNER JOIN candidates USING(id)
INNER JOIN section ON (section.id = house.section_id)
INNER JOIN shape ON(shape.id = house.shape_id)
INNER JOIN city ON (city.id = section.city_id)
ORDER BY house.section_id, house.age, house.main_area, house.price;
