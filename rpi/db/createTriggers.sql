CREATE TRIGGER IF NOT EXISTS only_one_playing_game_insert_check 
   BEFORE INSERT ON games
   WHEN NEW.playing = true
BEGIN
	UPDATE  games 
  	SET
    	playing = false
	WHERE
		playing = true;
END;

CREATE TRIGGER IF NOT EXISTS only_one_playing_game_update_check
   BEFORE UPDATE OF playing ON games
   WHEN NEW.playing = true
BEGIN
	UPDATE  games 
  	SET
    	playing = false
	WHERE
		playing = true;
END;

