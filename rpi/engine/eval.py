import chess
#import string
import sqlite3
import chess.engine

'''
def get_eval(play_id):
	con = sqlite3.connect('../pwa/db.sqlite')
	cur = con.cursor()
	cur.execute("select * from eval where id=?",(play_id))
	play=cur.fetchone()
	eval_value=play["evaluation"]
	return eval_value
'''
def update_eval():
	engine = chess.engine.SimpleEngine.popen_uci("../rpi/engine/stockfish")
	con = sqlite3.connect('../pwa/db.sqlite')
	cur = con.cursor()
	cur.execute("select * from plays order by Timestamp DESC limit 1")
	last_play=cur.fetchone()
	fen=last_play["fen"]
	play_id=last_play["id"]
	#board = chess.Board("r1bqkbnr/p1pp1ppp/1pn5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 2 4")
	#when we have values
	board = chess.Board(fen)
	eval_score = engine.analyse(board, chess.engine.Limit(depth=20))
	#print("Score:", info["score"])
	cur.execute("update plays set (evaluation) values (?) where id=(?)", (eval_score,play_id))
	con.commit()
	engine.quit()