--liquibase formatted sql

--changeset city:1
CREATE TABLE IF NOT EXISTS city(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

--changeset city:2
CREATE UNIQUE INDEX ON city(name);
