#!/usr/bin/env python3

import os
import errno
import chess
import string
import sqlite3

FIFO = '../fifo_ipc'
fifo = None
con = None


def parse_position(p):
    row = (p // 8) + 1
    col_n = (p % 8)
    col = string.ascii_lowercase[col_n]
    return str(col)+str(row)


def listen_move_mockup():
    pos_begin = int(input("Begin:"))
    pos_end   = int(input("End:"))
    return pos_begin, pos_end


def start():
    # Inicialitzacio partida
    cur = con.cursor()
    cur.execute("select id from games order by Timestamp DESC limit 1")
    r = cur.fetchone()
    game_id = r['id']

    #stockfish.set_fen_position("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")
    board = chess.Board("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")

    while not board.is_checkmate():
        begin, end = listen_move_mockup()
        uci_move = parse_position(begin)+parse_position(end) 
        san_move = chess.Move.from_uci(uci_move)
        print("Moviment: "+uci_move)
        if(san_move in board.legal_moves):
            board.push(san_move)
            fen = board.board_fen()
            cur.execute("insert into plays (gid,fen) values (?, ?)", (game_id, fen))
            con.commit()
            print("Inserit a la base de dades")
        else:
            print("Mal moviment")
    


if __name__ == '__main__':
    try:
        os.mkfifo(FIFO)
    except OSError as oe:
        if oe.errno != errno.EEXIST:
            raise

    fifo = open(FIFO)
    #stockfish = Stockfish(path="/Users/marcclasca/Documents/UPC/Erasmus/SE/Stockfish/src")
    con = sqlite3.connect('../pwa/db.sqlite')
    con.row_factory = sqlite3.Row

    print("Engine running")
    
    #Esperem comanda
    while True:
        data = fifo.readline()
        if len(data) == 0:
            continue
        if data == "1":
            #Start
            start()
        else:
            print(data)
            print("Unknown command from pipe")


