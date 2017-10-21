DROP TABLE kit;

CREATE TABLE IF NOT EXISTS kit (
    id                  serial      CONSTRAINT kit_id_pk PRIMARY KEY,
    entity_id           uuid        NOT NULL,
    version             smallint  NOT NULL,
    created_at          timestamp   NOT NULL,
    created_by          varchar(60) NOT NULL,
    updated_at          timestamp   NOT NULL,
    updated_by          varchar(60) NOT NULL,
    activate_at         timestamp   NOT NULL,
    deactivate_at       timestamp,
    state               smallint    NOT NULL,
    title               varchar(60)     NOT NULL,
    description         varchar(255)    NOT NULL
);

-- CREATE INDEX IF NOT EXISTS entity_id
--     ON public.kit USING btree
--     (entity_id ASC NULLS LAST)
--     TABLESPACE pg_default;

-- CREATE INDEX IF NOT EXISTS index_activate_at
--     ON public.kit USING btree
--     (activate_at DESC NULLS LAST)
--     TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS item (
    id                  serial      CONSTRAINT item_id_pk PRIMARY KEY,
    entity_id           uuid        NOT NULL,
    version             smallint  NOT NULL,
    created_at          timestamp   NOT NULL,
    created_by          varchar(60) NOT NULL,
    updated_at          timestamp   NOT NULL,
    updated_by          varchar(60) NOT NULL,
    activate_at         timestamp   NOT NULL,
    deactivate_at       timestamp,
    state               smallint    NOT NULL,
    title               varchar(60)     NOT NULL,
    description         varchar(255)    NOT NULL,
    category_uuid       uuid,
    cost                money,
    ignore_cost_in_kit  boolean   
);

CREATE TABLE IF NOT EXISTS item_category (
    id                  serial      CONSTRAINT item_category_id_pk PRIMARY KEY,
    entity_id           uuid        NOT NULL,
    version             smallint  NOT NULL,
    created_at          timestamp   NOT NULL,
    created_by          varchar(60) NOT NULL,
    updated_at          timestamp   NOT NULL,
    updated_by          varchar(60) NOT NULL,
    activate_at         timestamp   NOT NULL,
    deactivate_at       timestamp,
    state               smallint    NOT NULL,
    title               varchar(60)     NOT NULL,
    description         varchar(255)    NOT NULL,
    is_required         BOOLEAN
);