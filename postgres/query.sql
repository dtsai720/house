-- name: InsertCity :one
INSERT INTO city (name) VALUES (@name) ON CONFLICT(name) DO UPDATE SET name = @name RETURNING id;

-- name: InsertSection :one
INSERT INTO section (name, city_id) VALUES (@name, @city_id) ON CONFLICT(name, city_id) DO UPDATE SET name = @name RETURNING id;

-- name: UpsertHourse :exec
INSERT INTO hourse (section_id, link, layout, address, price, floor, shape, age, area, main_area, raw ,created_at, updated_at)
VALUES (@section_id, @link, @layout, @address, @price, @floor, @shape, @age, @area, @main_area, @raw ,CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
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
LEFT JOIN section ON(hourse.section_id = section.id)
LEFT JOIN city ON(hourse.city_id = city.id)
WHERE hourse.updated_at > CURRENT_TIMESTAMP - INTERVAL '7 day'
    AND hourse.id NOT IN (SELECT id FROM duplicate)
    AND (city.name = ANY(@city :: VARCHAR[]) OR COALESCE(@city, '') = '')
    AND (hourse.shape IN (@shape :: VARCHAR[]) OR COALESCE(@shape, '') = '')
    AND (section.name IN (@section :: VARCHAR[]) OR COALESCE(@section, '') = '')
    AND (hourse.price <= @max_price :: DECIMAL OR COALESCE(@max_price, '') = '')
    AND (hourse.price > @min_price :: DECIMAL OR COALESCE(@min_price, '') = '')
    AND (hourse.age < @age OR COALESCE(@age, '') = '')
    AND (hourse.main_area <= @max_main_area :: DECIMAL OR COALESCE(@max_main_area, '') = '')
    AND (hourse.main_area > @min_main_area :: DECIMAL OR COALESCE(@min_main_area, '') = '')
)
SELECT
    hourse.*,
    CONCAT(city.name, section.name, hourse.address) :: VARCHAR AS location,
    city.name :: TEXT AS city,
    section.name :: TEXT AS section,
    (SELECT COUNT(1) FROM candidates) AS total_count
FROM hourse
INNER JOIN candidates USING(id)
LEFT JOIN section ON (section.id=hourse.section_id)
LEFT JOIN city ON (city.id=section.city_id)
ORDER BY hourse.age, hourse.price, hourse.main_area;
