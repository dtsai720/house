--liquibase formatted sql

--changeset section:1
CREATE TABLE IF NOT EXISTS section (
    id SERIAL PRIMARY KEY,
    city_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

--changeset section:2
BEGIN TRANSACTION;
CREATE UNIQUE INDEX ON section(name, city_id);
CREATE INDEX ON section(city_id);
ALTER TABLE section ADD FOREIGN KEY (city_id) REFERENCES city(id) ON UPDATE CASCADE ON DELETE CASCADE;
COMMIT;
