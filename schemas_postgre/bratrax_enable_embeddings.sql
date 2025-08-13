CREATE TABLE embedding (
    project_uuid UUID NOT NULL REFERENCES projects(project_uuid) ON DELETE CASCADE,
    encoded_secret BYTEA NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    dashboard_uuids TEXT[] NOT NULL,
    created_by UUID REFERENCES users(user_uuid) ON DELETE SET NULL,
    allow_all_dashboards BOOLEAN DEFAULT FALSE,
    UNIQUE (project_uuid)
);