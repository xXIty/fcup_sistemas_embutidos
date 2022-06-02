
#!/usr/bin/env python3

import os
import errno
import chess
import string
import sqlite3


# Named pipe command
COM_GAME_PLAY = "1"
COM_PAWN_PROM = "2"


def db_insert_fen(connection, game_id, fen):
    cur = connection.cursor()
    cur.execute("insert into plays (gid,fen) values (?, ?)", (game_id, fen))
    connection.commit()


def db_get_game_playing_id(connection):
    connection.row_factory  =  sqlite3.Row                                                              
    cursor =  connection.cursor()                                                      
    query  =  "select id from games order by Timestamp DESC limit 1"
    cursor.execute(query)
    if row := cursor.fetchone():
        game_id = row['id']
        return game_id
    else:
        return None


def db_get_fen_latest(connection, game_id):
    connection.row_factory = sqlite3.Row                                                              
    cursor =  connection.cursor()                                                      
    query  =  "select fen from plays where gid = (?) order by Timestamp DESC limit 1"

    cursor.execute(query, (str(game_id)))

    if row := cursor.fetchone():
        fen = row['fen']
        return fen
    else:
        return None
    
def db_update_games_finished(db_connection, game_id, reason, winner):
    query = "update games values (finished, reason, winner) values (?,?,?) where gid = (?)" 
    cursor = db_connection.cursor()
    cursor.execute(query, (True, reason, winner, game_id))


def parse_position(p):
    row      = (p // 8) + 1
    col_num  = (p % 8)
    col_char = string.ascii_lowercase[col_num]
    return col_char + str(row)


def uart_rec_move_mockup():
    pos_begin = int(input("Begin:"))
    pos_end   = int(input("End:"))
    return pos_begin, pos_end


def pipe_command_rec(fifo_path):
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


def game_play(db_connection, game_id):

    print("[+] Game id: " + str(game_id))
    fen_latest = db_get_fen_latest(db_connection, game_id)

    board = chess.Board(fen_latest)
    
    while not board.is_game_over() :

        #begin, end = uart_rec_move_mockup()

        # If not playing dont process move 
        if game_id != db_get_game_playing_id(db_connection):
            break

        # move_uci = parse_position(begin)+parse_position(end) 
        move_uci = input("Insert a uci move (ex: a2a3): ")

        move_san = chess.Move.from_uci(move_uci)
        print("Moviment: "+move_uci)
        if(move_san in board.legal_moves):
            board.push(move_san)
            fen = board.fen()
            db_insert_fen(db_connection, game_id, fen)
            print("Inserit a la base de dades")
        else:
            print("Mal moviment")

    if board.is_game_over():
        winner = "d" # (d)raw
        game_outcome = board.outcome()

        if game_outcome.winner:
            winner = game_outcome.winner

        db_update_games_finished(db_connection, game_id, game_outcome.termination, winner)

    
if __name__ == '__main__':
    db_connection  =  None
    db_path        =  '../pwa/db.sqlite'
    fifo_path      =  '../fifo_ipc'

    print("[+] Opening connection to sqlite")
    db_connection  =  sqlite3.connect(db_path)

    while command_from_pwa := pipe_command_rec(fifo_path):

        if command_from_pwa == COM_GAME_PLAY:
            game_id =  db_get_game_playing_id(db_connection)
            game_play(db_connection, game_id)

        else:
            print(command_from_pwa)
            print("Unknown command from pipe")



