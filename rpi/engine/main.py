#!/usr/bin/env python3

import os
import errno
import chess
import string
import sqlite3

# Named pipe command
COM_GAME_START = "1"

fifo_path = '../fifo_ipc'
fifo = None
db_connection = None
cursor = None


def db_insert_fen(connection, game_id, fen):
    cur = connection.cursor()
    cur.execute("insert into plays (gid,fen) values (?, ?)", (game_id, fen))
    connection.commit()


def db_get_game_playing_id(connection):
    connection.row_factory  =  sqlite3.Row                                                              
    cursor =  connection.cursor()                                                      
    query  =  "select id from games order by Timestamp DESC limit 1"
    cursor.execute(query)
    row = cursor.fetchone()
    game_id = row['id']
    return game_id


def parse_position(p):
    row      = (p // 8) + 1
    col_num  = (p % 8)
    col_char = string.ascii_lowercase[col_num]
    return col_char + str(row)


def uart_rec_move_mockup():
    pos_begin = int(input("Begin:"))
    pos_end   = int(input("End:"))
    return pos_begin, pos_end


def game_play(game_id):

    board = chess.Board("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")

    while not board.is_checkmate():
        begin, end = uart_rec_move_mockup()
        move_uci = parse_position(begin)+parse_position(end) 
        move_san = chess.Move.from_uci(move_uci)
        print("Moviment: "+move_uci)
        if(move_san in board.legal_moves):
            board.push(move_san)
            fen = board.fen()
            db_insert_fen(db_connection, game_id, fen)
            print("Inserit a la base de dades")
        else:
            print("Mal moviment")
    
def command_receive(fifo_path):
    try:
        os.mkfifo(fifo_path)
    except OSError as oe:
        if oe.errno != errno.EEXIST:
            raise

    print("[+] Opening FIFO")
    fifo = open(fifo_path)

    #Esperem comanda
    while True:
        command = fifo.readline()
        if len(command) == 0:
            continue
        else:
            print("[+] New game command recived")
            return command


if __name__ == '__main__':

    command_from_pwa = command_receive(fifo_path)

    if command_from_pwa == COM_GAME_START:

        print("[+] Opening connection to sqlite")
        db_path = '../pwa/db.sqlite'
        db_connection = sqlite3.connect(db_path)
        game_id = db_get_game_playing_id(db_connection)
        game_play(game_id)

    else:
        print(command_from_pwa)
        print("Unknown command from pipe")



