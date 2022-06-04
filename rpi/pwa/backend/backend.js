const sqlite3 = require("sqlite3");
const fs = require('fs');

/////////////////////////
// Establish DB connection
/////////////////////////
const DB_NAME = "db/db.sqlite"

const db = new sqlite3.Database(DB_NAME, (err) => {
    if (err) {
        // Cannot open database
        console.error(err.message);
        throw err;
    } else {
        console.log("Connected to the SQLite database.");
        db.run("PRAGMA foreign_keys = ON;")
    }
});


/////////////////////////
// DB operations
/////////////////////////
function selectMostRecentGame(callback) {
    db.get("SELECT * FROM games WHERE playing = true LIMIT 1", (err, row)=>{
        if(err) {
            //handle error
            console.log(`currentERROR: ${err}`)
        } else {
            callback(row)
        }
    });
}

function selectGames(callback) {
    db.all(`SELECT * FROM games ORDER BY timestamp DESC `,
        (err, row) => {
            if(err) {
                //handle error
            } else {
                callback(row);
            }
        });
}

function writeToPipe(path, message) {
    var fifo = fs.createWriteStream(path);
    fifo.write(message)
    fifo.close()

}

/////////////////////////
// Backend operations
/////////////////////////
module.exports = {
    // POST: /game/new
    createNewGameAndRedirect: function (req, res, fifo_path) {
        var insert = "INSERT INTO games (name, playing, finished) VALUES ('new_game',true,false)";
        db.run(insert, (err) => {
            console.log(err)
            if (!err) {
                selectMostRecentGame(game => {
                    var fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
                    db.run("INSERT INTO plays (gid,fen) VALUES (?,?)", [game.id, fen], (err) => {
                        writeToPipe(fifo_path,'1'); 
                    });

                    res.redirect('/play')
                });
            }
        });

    },
    // POST: /fen
    addNewFen: function (req, res) {
        selectMostRecentGame(game => {
            var fen = req.params.fen;
            db.run("INSERT INTO plays (gid,fen) VALUES (?,?)", [game.id, fen]);
            res.sendStatus(200);
        });
    },
    // GET: /analyze/:gid
    analyzeGame: function(req, res) {
        db.all(`SELECT fen FROM plays WHERE gid = ${req.params.gid}  ORDER BY timestamp `, (err, rows) => {
            fens = rows.flatMap(r => r.fen);
            res.render("analyze", {fens: fens});
        });
    },
    // GET: /play/:gid
    setPlayingAndRedirect: function (req, res, fifo_path) {
        db.run(`UPDATE games SET playing = true WHERE id = ${req.params.gid}`, (err, rows) => {
            writeToPipe(fifo_path,'1'); 
            res.redirect('/play')

        });

    },
    // GET: /current
    getCurrentGame: function (req, res) {
        selectMostRecentGame( game => {
            if (game) {
                db.all(`SELECT fen FROM plays WHERE gid = ${game.id}  ORDER BY timestamp `,
                        (err, rows)=> {
                            fens = rows.flatMap(r => r.fen);
                            currentGame = {gid: game.id, fens: fens, name: game.name, interaction: game.interaction }
                            res.json(currentGame);
                        });
                return
            }
            res.redirect('/')
        });
    },
    // GET: /analyze
    showAllGames: function (req, res) {
        selectGames(games => {
            console.log(games);
            res.render('games', {games: games});
        }); 
    },
    // POST: /game/:gid/delete
    deleteGameById: function (req, res) {

        db.run(`DELETE FROM games WHERE id=${req.params.gid}`, (err) => {
            if(err) {

            } else {
                res.redirect("/analyze");
            }
        });
    },
    // POST: /game/:gid/edit
    editGameById: function (req, res) {

        db.run(`UPDATE games SET name = '${req.body.name}' WHERE id=${req.params.gid}`, (err) => {
            if(err) {
                console.log(`ERR UPDATE: ${err}`)
            } else {
                res.redirect("/analyze");
            }
        });
    },
    pawnPromotion: function (req, res, fifo_path) {
        db.run(`UPDATE games SET interaction = false WHERE playing = true`, (err, row) => {
            writeToPipe(fifo_path,req.body.piece); 

        });
    }
};
