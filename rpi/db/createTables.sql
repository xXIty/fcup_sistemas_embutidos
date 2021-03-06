PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS
  games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    playing BOOL NOT NULL,
    finished BOOL NOT NULL DEFAULT FALSE,
    reason INT, 
    winner CHAR,
    interaction BOOL NOT NULL DEFAULT false,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

CREATE TABLE IF NOT EXISTS
  plays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fen TEXT NOT NULL,
    score TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    gid INTEGER NOT NULL,
    interaction BOOL NOT NULL DEFAULT false,
    evaluation TEXT DEFAULT null,
    FOREIGN KEY (gid) REFERENCES games (id) ON DELETE CASCADE
  );
  
