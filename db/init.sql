CREATE TABLE IF NOT EXISTS kit (
    id                  serial,
    entity_id           uuid,
    version             NUMERIC(1),
    created_at          timestamp,
    created_by          varchar(60),
    updated_at          timestamp,
    updated_by          varchar(60),
    activate_at         timestamp,
    deactivate_at       timestamp,
    state               smallint,
    title               varchar(60),
    description         varchar(255)
);
ALTER TABLE public.kit
    ADD CONSTRAINT id_pk PRIMARY KEY (id);

CREATE UNIQUE INDEX IF NOT EXISTS index_id
    ON public.kit USING btree
    (id ASC NULLS LAST)
    TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS entity_id
    ON public.kit USING btree
    (entity_id ASC NULLS LAST)
    TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS index_activate_at
    ON public.kit USING btree
    (activate_at DESC NULLS LAST)
    TABLESPACE pg_default;