DELETE FROM games WHERE name='Example1';
INSERT INTO games (name) 
	VALUES 
    ('Example1');
INSERT INTO plays (fen, gid) 
	VALUES 
    ('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', (SELECT id FROM games WHERE name='Example1' LIMIT 1)), 
	('rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b KQkq - 1 1', (SELECT id FROM games WHERE name='Example1' LIMIT 1)),
    ('rnbqkbnr/ppp1pppp/8/3p4/8/5N2/PPPPPPPP/RNBQKB1R w KQkq - 0 2', (SELECT id FROM games WHERE name='Example1' LIMIT 1)),
    ('rnbqkbnr/ppp1pppp/8/3p4/3P4/5N2/PPP1PPPP/RNBQKB1R b KQkq - 0 2', (SELECT id FROM games WHERE name='Example1' LIMIT 1)),
    ('rnbqkb1r/ppp1pppp/5n2/3p4/3P4/5N2/PPP1PPPP/RNBQKB1R w KQkq - 1 3', (SELECT id FROM games WHERE name='Example1' LIMIT 1)),
    ('rnbqkb1r/ppp1pppp/5n2/3p4/2PP4/5N2/PP2PPPP/RNBQKB1R b KQkq - 0 3', (SELECT id FROM games WHERE name='Example1' LIMIT 1)),
    ('rnbqkb1r/ppp2ppp/4pn2/3p4/2PP4/5N2/PP2PPPP/RNBQKB1R w KQkq - 0 4', (SELECT id FROM games WHERE name='Example1' LIMIT 1));
