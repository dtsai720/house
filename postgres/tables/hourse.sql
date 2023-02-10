--liquibase formatted sql

--changeset hourse:1
CREATE TABLE IF NOT EXISTS hourse(
    id BIGSERIAL PRIMARY KEY,
    universal_id uuid NOT NULL DEFAULT gen_random_uuid(),
    section_id INTEGER NOT NULL,
    link VARCHAR(255) NOT NULL,
    layout VARCHAR(64),
    address VARCHAR(255),
    price DECIMAL(8, 2) NOT NULL,
    floor VARCHAR(64) NOT NULL,
    shape VARCHAR(64) NOT NULL,
    age VARCHAR(32) NOT NULL,
    area DECIMAL(8, 2) NOT NULL,
    main_area DECIMAL(8, 2),
    raw jsonb NOT NULL,
    others VARCHAR[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT hourse_link_unique UNIQUE(link),
    CONSTRAINT hourse_universal_id_unique UNIQUE(universal_id),
    CONSTRAINT hourse_section_id_foreign FOREIGN KEY (section_id) REFERENCES section(id) ON UPDATE CASCADE ON DELETE CASCADE
);
