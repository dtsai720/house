--liquibase formatted sql

--changeset city:1
CREATE TABLE IF NOT EXISTS city(
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT city_name_unique UNIQUE(name)
);
