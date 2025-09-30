CREATE TABLE IF NOT EXISTS user_search_history (
  user_id TEXT NOT NULL,
  query TEXT NOT NULL,
  results_count INTEGER NOT NULL DEFAULT 0,
  run_count INTEGER NOT NULL DEFAULT 1,
  last_searched_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (user_id, query),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS user_search_history_last_searched_idx
  ON user_search_history(last_searched_at DESC);
