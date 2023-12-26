--liquibase formatted sql

--changeset house:1
CREATE TABLE IF NOT EXISTS house(
    id SERIAL PRIMARY KEY,
    universal_id UUID NOT NULL DEFAULT gen_random_uuid(),
    section_id INTEGER NOT NULL,
    shape_id INTEGER NOT NULL,
    link VARCHAR(255) NOT NULL,
    layout VARCHAR(64),
    address VARCHAR(255),
    price DECIMAL(8, 2) NOT NULL,
    floor VARCHAR(64) NOT NULL,
    age VARCHAR(32) NOT NULL,
    area DECIMAL(8, 2) NOT NULL,
    main_area DECIMAL(8, 2),
    raw jsonb NOT NULL,
    others VARCHAR[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

--changeset house:2
BEGIN TRANSACTION;
CREATE UNIQUE INDEX ON house(link);
CREATE INDEX ON house(section_id);
CREATE INDEX ON house(shape_id);
ALTER TABLE house ADD FOREIGN KEY (section_id) REFERENCES section(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE house ADD FOREIGN KEY (shape_id) REFERENCES shape(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE house ADD CHECK(price > 0);
COMMIT;
