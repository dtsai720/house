--liquibase formatted sql

--changeset shape:1
CREATE TABLE IF NOT EXISTS shape (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

--changeset shape:2
CREATE UNIQUE INDEX ON shape(name);
