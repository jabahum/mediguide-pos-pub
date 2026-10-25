-- +goose Up
CREATE INDEX idx_calculator_usage_logs_tool_start
    ON calculator_usage_logs (calculator_id, session_start)
    WHERE deleted_at IS NULL;

-- +goose Down
DROP INDEX IF EXISTS idx_calculator_usage_logs_tool_start;
