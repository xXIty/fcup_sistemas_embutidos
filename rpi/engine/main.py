
#!/usr/bin/env python3

import argparse
import os
import errno
import chess
import string
import sqlite3
from time import sleep
import serial



# Named pipe command
COM_GAME_PLAY = "1"
COM_PAWN_PROM = "2"

# Arduino LED codes
LED_GREEN  =  0
LED_RED    =  1
LED_OFF    =  2


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

def db_set_promotion_handle(db_connection, game_id):
    query = "UPDATE games SET interaction = true WHERE id = (?);"
    cursor = db_connection.cursor()
    cursor.execute(query, (str(game_id),))
    db_connection.commit()


# UART handling
# ------------------

def uart_rec_square_mockup():
    square = int(input("Square: "))
    return square

def uart_rec_square():
    #return uart_rec_square_mockup()
    char = serial_com.readline().decode('utf-8').rstrip();
    return int(char)

def uart_send_byte(byte):
    serial_com.write(byte)


# Named PIPE handling
# --------------------

def pipe_command_rec(fifo):
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

def is_promoting(board: chess.Board, move: chess.Move) -> bool:
     """
     Checks whether the *move* is either a white pawn or a black pawn attempting
     to promote.
     Returns ``True`` only if all conditions are met. These conditions include
     that the piece is actually a pawn, it is attempting to move from the
     pre-last to the last rank and is not pinned to its king. Also, the target
     square must be vacant or a legal capture.
     """
     piece_type = board.piece_type_at(move.from_square)

     if piece_type != chess.PAWN:
         return False

     if board.turn and chess.square_rank(move.to_square) != 7:
         return False
     elif not board.turn and chess.square_rank(move.to_square) != 0:
         return False

     if move.uci() not in [move.uci()[0:4] for move in board.legal_moves]:
         return False

     return True


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
            uart_send_byte(bytes([LED_OFF]))
        else:
            move_end = board_square

        game_id = game_id_aux

    move_uci = chess.SQUARE_NAMES[move_begin] + chess.SQUARE_NAMES[move_end] 
    return game_id, move_uci

def board_make_move_uci(db_connection, game_id, board, move_uci, fifo):
    move_san = None
    try:
        move_san  =  chess.Move.from_uci(move_uci)
    except ValueError as ve:
        print("\t[+] Moviment mal formatat. Error: "+str(ve))
        uart_send_byte(bytes([LED_RED]))
        return

    if(is_promoting(board, move_san)):
        # Is a promotion. Need to ask the user.
        print("\t[+] Move is a pawn promotion")

        # Clean fifo
        fifo.read()

        # Warn for pawn promotion to pwa
        db_set_promotion_handle(db_connection, game_id)

        # Read choosed piece
        piece_sym = ""
        while len(piece_sym) == 0:
            piece_sym = fifo.read(1)
            sleep(0.5)

        print("Read from fifo: " + str(piece_sym))

        piece = chess.Piece.from_symbol(piece_sym)
        move_san.promotion = piece.piece_type
        print("\t[+] Generating new move {} with promotion of piece {}".format(move_uci,piece.symbol()))

    # Push the move if it is legal move
    if(move_san in board.legal_moves):
        uart_send_byte(bytes([LED_GREEN]))
        board.push(move_san)
        fen = board.fen()
        db_insert_fen(db_connection, game_id, fen)
        print("\t[+] Move done successfully")
    else:
        uart_send_byte(bytes([LED_RED]))
        print("\t[!] Bad move")


def game_playing_play(db_connection):
    game_id     =  db_get_game_playing_id(db_connection)
    fen_latest  =  db_get_fen_latest(db_connection, game_id)

    board       =  chess.Board(fen_latest)
    board_move  =  []

    while board_move := get_board_move_uci(db_connection):
        game_id_aux  =  board_move[0]
        move_uci     =  board_move[1]
        move_uci = input("Insert a uci move (ex: a2a3): ") # quick way to play (mock)


        # Update board if game has changed
        if game_id != game_id_aux: 
            game_id     =  game_id_aux
            fen_latest  =  db_get_fen_latest(db_connection, game_id)
            board.set_fen(fen_latest)
            print("\t[+] New game: " + str(game_id))

        # Process move
        print("\t[+] FEN: " + str(fen_latest))
        print("\t[+] Processing move: " + move_uci)
        board_make_move_uci(db_connection, game_id, board, move_uci, fifo)

        # Handle game over
        if board.is_game_over():
            print("\t[+] Game finished, updating stats")
            game_outcome = board.outcome()

            winner = "d" # (d)raw
            if game_outcome.winner == chess.WHITE:
                winner = "w" # (w)hite
            elif game_outcome.winner == chess.BLACK:
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
    fifo                =  None
    serial_com          = serial.Serial('/dev/ttyACM0',9600)

    serial_com.reset_input_buffer()

    try:
        os.mkfifo(fifo_path)
    except OSError as oe:
        if oe.errno != errno.EEXIST:
            raise

    fifo = open(fifo_path)

    print("[+] Opening connection to sqlite")
    try:
        db_connection  =  sqlite3.connect(db_path)
    except sqlite3.OperationalError as e:
        print("[!] Falied to connect to DB")
        print("Error: " + str(e))
        quit()

    while command_from_pwa := fifo.read(1):
        if command_from_pwa == COM_GAME_PLAY:
            game_playing_play(db_connection)

        else:
            print(command_from_pwa)
            print("Unknown command from pipe")
