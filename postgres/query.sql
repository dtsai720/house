-- name: InsertCity :one
INSERT INTO city (name) VALUES (@name) ON CONFLICT(name) DO UPDATE SET name = @name RETURNING id;

-- name: GetCity :one
SELECT * FROM city WHERE name = @name;

-- name: InsertSection :one
INSERT INTO section (name, city_id) VALUES (@name, @city_id) ON CONFLICT(name, city_id) DO UPDATE SET name = @name RETURNING id;

-- name: GetSection :one
SELECT * FROM section WHERE name = @name;

-- name: InsertShape :one
INSERT INTO shape (name) VALUES (@name) ON CONFLICT(name) DO UPDATE SET name = @name RETURNING id;

-- name: GetShape :one
SELECT * FROM shape WHERE name = @name;

-- name: UpsertHourse :exec
INSERT INTO hourse (section_id, link, layout, address, price, floor, shape_id, age, area, main_area, raw, others ,created_at, updated_at)
VALUES (@section_id, @link, @layout, @address, @price, @floor, @shape_id, @age, @area, @main_area, @raw, @others ,CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (link) DO UPDATE SET price = @price, raw = @raw, age = @age, updated_at = CURRENT_TIMESTAMP;

-- name: GetHourses :many
WITH duplicate_conditions AS (
    SELECT MIN(id) AS id, section_id, address, age, area
    FROM hourse
    WHERE link LIKE 'https://sale.591.com.tw/home%'
    AND updated_at > CURRENT_TIMESTAMP - INTERVAL '7 day'
    GROUP BY section_id, address, age, area
    HAVING count(1) > 1
),
duplicate AS (
    SELECT hourse.id
    FROM hourse
    INNER JOIN duplicate_conditions ON(
            hourse.section_id = duplicate_conditions.section_id
        AND hourse.address = duplicate_conditions.address
        AND hourse.age = duplicate_conditions.age
        AND hourse.area = duplicate_conditions.area
        AND hourse.link LIKE 'https://sale.591.com.tw/home%'
    )
    WHERE hourse.id NOT IN (SELECT id FROM duplicate_conditions)
    AND hourse.updated_at > CURRENT_TIMESTAMP - INTERVAL '7 day'
),
candidates AS (
SELECT hourse.id
FROM hourse
INNER JOIN section ON(hourse.section_id = section.id)
INNER JOIN city ON(section.city_id = city.id)
INNER JOIN shape ON(hourse.shape_id = shape.id)
WHERE hourse.updated_at > CURRENT_TIMESTAMP - INTERVAL '7 day'
    AND hourse.id NOT IN (SELECT id FROM duplicate)
    AND (COALESCE(@city, '') = '' OR city.name = ANY(string_to_array(@city, ',')))
    AND (COALESCE(@section, '') = '' OR section.name = ANY(string_to_array(@section, ',')))
    AND (COALESCE(@shape, '') = '' OR hourse.shape = ANY(string_to_array(@shape, ',')))
    AND (COALESCE(@max_price, '') = '' OR hourse.price <= @max_price :: DECIMAL)
    AND (COALESCE(@min_price, '') = '' OR hourse.price > @min_price :: DECIMAL)
    AND (COALESCE(@age, '') = '' OR hourse.age < @age)
    AND (COALESCE(@max_main_area, '') = '' OR hourse.main_area <= @max_main_area :: DECIMAL)
    AND (COALESCE(@min_main_area, '') = '' OR hourse.main_area > @min_main_area :: DECIMAL)
)
SELECT
    hourse.*,
    CONCAT(city.name, section.name, hourse.address) :: VARCHAR AS location,
    city.name :: TEXT AS city,
    section.name :: TEXT AS section,
    shape.name :: TEXT AS shape,
    (SELECT COUNT(1) FROM candidates) AS total_count
FROM hourse
INNER JOIN candidates USING(id)
INNER JOIN section ON (section.id = hourse.section_id)
INNER JOIN shape ON(shape.id = hourse.shape_id)
INNER JOIN city ON (city.id = section.city_id)
ORDER BY hourse.age, hourse.price, hourse.main_area;
