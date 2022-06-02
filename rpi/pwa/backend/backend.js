const sqlite3 = require("sqlite3");
const fs = require('fs');
/////////////////////////
// Establish DB connection
/////////////////////////

const db = new sqlite3.Database("db.sqlite", (err) => {
  if (err) {
    // Cannot open database
    console.error(err.message);
    throw err;
  } else {
    console.log("Connected to the SQLite database.");
  }
});

/////////////////////////
// Create tables
/////////////////////////

fs.readFile('./db/createTables.sql', 'utf8', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
    data.split('\n').forEach( line => {
        if (line !== "") {
            db.run(line, (err) => {
                if(err) console.log("Warning: Using existing tables");
            });
        }
    });
});

/////////////////////////
// DB operations
/////////////////////////
function selectMostRecentGame(callback) {
    db.get("SELECT id FROM games ORDER BY Timestamp DESC", (err, row)=>{
        if(err) {
            //handle error
        } else {
            callback(row);
        }
    });
}

function selectGames(callback) {
    db.all(`SELECT * FROM games ORDER BY Timestamp DESC `,
        (err, row) => {
            if(err) {
                //handle error
            } else {
                callback(row);
            }
        });
}

/////////////////////////
// Backend operations
/////////////////////////
module.exports = {
    // POST: /play/new
    createNewGameAndRedirect: function (req, res) {
        var insert = "INSERT INTO games (name) VALUES (?)";
        db.run(insert, ["new_game"], (err) => {
            if (!err) {
                selectMostRecentGame(game => {
                    var fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
                    db.run("INSERT INTO plays (gid,fen) VALUES (?,?)", [game.id, fen]);

                    res.redirect('/play');
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
        db.all(`SELECT fen FROM plays WHERE gid = ${req.params.gid}  ORDER BY Timestamp `, (err, rows) => {
            //console.log(rows);
            fens = rows.flatMap(r => r.fen);
            res.render("analyze", {fens: fens});
        });
    },
    // GET: /current
    getCurrentGame: function (req, res) {
        selectMostRecentGame( game => {
            db.all(`SELECT fen FROM plays WHERE gid = ${game.id}  ORDER BY Timestamp `,
                    (err, rows)=> {
                        fens = rows.flatMap(r => r.fen);
                        currentGame = {gid: game.id, fens: fens, name: game.name}
                        res.json(currentGame);
                    });
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
    }
};
