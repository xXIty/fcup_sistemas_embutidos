PRAGMA foreign_keys = ON;

DROP TRIGGER only_one_playing_game_insert_check;
DROP TRIGGER only_one_playing_game_update_check;
DROP TABLE games;
DROP TABLE plays;
