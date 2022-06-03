
#!/usr/bin/env python3

import argparse
import os
import errno
import chess
import string
import sqlite3


# Named pipe command
COM_GAME_PLAY = "1"
COM_PAWN_PROM = "2"


# DB queries
# ---------------

def db_insert_fen(connection, game_id, fen):
    cur = connection.cursor()
    cur.execute("insert into plays (gid,fen) values (?, ?)", (game_id, fen))
    connection.commit()


def db_get_game_playing_id(connection):
    connection.row_factory  =  sqlite3.Row                                                              
    cursor =  connection.cursor()                                                      
    query  =  "select id from games where playing = 1"
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

    cursor.execute(query, (str(game_id),))

    if row := cursor.fetchone():
        fen = row['fen']
        return fen
    else:
        return None
    
def db_update_games_finished(db_connection, game_id, reason, winner):
    query = "UPDATE games SET finished = true, reason = (?), winner = (?) WHERE id = (?);" 
    cursor = db_connection.cursor()
    cursor.execute(query, (reason, winner, game_id))
    db_connection.commit()


# UART handling
# ------------------

def uart_rec_square_mockup():
    square = int(input("Square: "))
    return square

def uart_rec_square():
    return uart_rec_square_mockup()


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


# Game maintainance
# -----------------

def get_board_move_uci(db_connection):
    move_begin  =  None
    move_end    =  None

    while move_end == None:
        game_id = db_get_game_playing_id(db_connection)

        if game_id is None:
            return None

        board_square = uart_rec_square()

        game_id_aux = db_get_game_playing_id(db_connection)
        # Return if no games in process
        if game_id_aux == None:
            return None
        elif game_id != game_id_aux or move_begin is None:
            move_begin = board_square
        else:
            move_end = board_square

        game_id = game_id_aux

    move_uci = chess.SQUARE_NAMES[move_begin] + chess.SQUARE_NAMES[move_end] 
    return game_id, move_uci


def game_playing_play(db_connection):
    game_id     =  db_get_game_playing_id(db_connection)
    fen_latest  =  db_get_fen_latest(db_connection, game_id)

    board       =  chess.Board(fen_latest)
    board_move  =  []

    while board_move := get_board_move_uci(db_connection):
        game_id_aux  =  board_move[0]
        move_uci     =  board_move[1]
        #move_uci = input("Insert a uci move (ex: a2a3): ") # quick way to play (mock)

        move_san     =  chess.Move.from_uci(move_uci)

        # Update board if game has changed
        if game_id != game_id_aux: 
            game_id     =  game_id_aux
            fen_latest  =  db_get_fen_latest(db_connection, game_id)
            board.set_fen(fen_latest)
            print("\t[+] New game: " + str(game_id))
            print("\t[+] FEN: " + str(fen_latest))

        # Process move
        print("\t[+] Processing move: " + move_uci)
        if(move_san in board.legal_moves):
            board.push(move_san)
            fen = board.fen()
            db_insert_fen(db_connection, game_id, fen)
            print("\t[+] Move done successfully")
        else:
            print("\t[!] Bad move")

        if board.is_game_over():
            print("\t[+] Game finished, updating stats")
            game_outcome = board.outcome()

            winner = "d" # (d)raw
            if game_outcome.winner == True:
                winner = "w" # (w)hite
            elif game_outcome.winner == False:
                winner = "b" # (b)lack

            db_update_games_finished(db_connection,
                                     game_id,
                                     game_outcome.termination.value,
                                     winner)
            break

    print("\t[+] Stop playing")

    
if __name__ == '__main__':

    script_description  =  "Process chess moves comming from arduino "
    script_description +=  "(via UART) and maintain match with web server "
    script_description +=  "using a named PIPE and updating db (sqlite3)."

    parser = argparse.ArgumentParser(description=script_description)
    parser.add_argument(
            "-f",
            "--fifo",
            required  =  True,
            help      =  "Path to fifo.")
    parser.add_argument(
            "-d",
            "--db",
            required  =  True,
            metavar   =  "File",
            help      =  "Path to database file.")

    args = parser.parse_args()

    db_connection       =  None
    db_path             =  args.db
    fifo_path           =  args.fifo

    print("[+] Opening connection to sqlite")
    try:
        db_connection  =  sqlite3.connect(db_path)
    except sqlite3.OperationalError as e:
        print("[!] Falied to connect to DB")
        print("Error: " + str(e))
        quit()

    while command_from_pwa := pipe_command_rec(fifo_path):
        if command_from_pwa == COM_GAME_PLAY:
            game_playing_play(db_connection)

        else:
            print(command_from_pwa)
            print("Unknown command from pipe")
