--liquibase formatted sql

--changeset section:1
CREATE TABLE IF NOT EXISTS section (
    id BIGSERIAL PRIMARY KEY,
    city_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT section_name_city_id_unique UNIQUE(name, city_id),
    CONSTRAINT section_city_id_foreign FOREIGN KEY (city_id) REFERENCES city(id) ON UPDATE CASCADE ON DELETE CASCADE
);