from time import sleep
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
        engine = chess.engine.SimpleEngine.popen_uci("./stockfish")
        con = sqlite3.connect('../db/db.sqlite')
        con.row_factory  =  sqlite3.Row                                                              
        cur = con.cursor()
        cur.execute("select id,fen from plays where score IS NULL;")
        rows = cur.fetchall()
        
        for r in rows:
            fen = r['fen']
            rid = r['id']
            print(rid)
            board = chess.Board(fen)
            eval_score = engine.analyse(board, chess.engine.Limit(depth=20))
            score = eval_score['score'].relative.score()/100.0
            print(score)
            cur.execute("update plays set score='{}' where id={}".format(score,rid))
            con.commit()
        engine.quit()

        con.close()

while 1:
    update_eval()
    sleep(1)
