PRAGMA foreign_keys = ON;
CREATE TABLE games (id INTEGER PRIMARY KEY AUTOINCREMENT, name text,timestamp DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE plays (id INTEGER PRIMARY KEY AUTOINCREMENT, fen text NOT NULL, score text, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, gid INTEGER NOT NULL, FOREIGN KEY (gid) REFERENCES games (id) ON DELETE CASCADE);
