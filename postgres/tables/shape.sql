--liquibase formatted sql

--changeset shape:1
CREATE TABLE IF NOT EXISTS shape (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT shape_name_unique UNIQUE(name)
);
