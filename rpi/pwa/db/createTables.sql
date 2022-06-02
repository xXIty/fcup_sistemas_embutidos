PRAGMA foreign_keys = ON;

CREATE TABLE games ( id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, playing BOOL NOT NULL, finished BOOL NOT NULL DEFAULT FALSE, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE plays ( id INTEGER PRIMARY KEY AUTOINCREMENT, fen TEXT NOT NULL, score TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, gid INTEGER NOT NULL, interaction BOOL NOT NULL DEFAULT false, FOREIGN KEY (gid) REFERENCES games (id) ON DELETE CASCADE);

CREATE TRIGGER only_one_playing_game_insert_check BEFORE INSERT ON games WHEN NEW.playing = true BEGIN UPDATE  games SET playing = false WHERE playing = true; END 

CREATE TRIGGER only_one_playing_game_update_check BEFORE UPDATE ON games WHEN NEW.playing = true BEGIN UPDATE  games SET playing = false WHERE playing = true; END
