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

    db.serialize( () => {
        data.toString().split('\n').forEach( line => {
            if (line) {
                db.run(line, (err) => {
                    console.log(line)
                    if(err) console.log(err);//console.log("Warning: Using existing tables");
                });
            }
        });
    });
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
            callback(row);
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

/////////////////////////
// Backend operations
/////////////////////////
module.exports = {
    // POST: /game/new
    createNewGameAndRedirect: function (req, res) {

        console.log(`POST /game/new : createNewGameAndRedirect`)
        var insert = "INSERT INTO games (name, playing, finished) VALUES ('new_game',true,false)";
        db.run(insert, (err) => {
            console.log(err)
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
        console.log(`POST /fen : addNewFen`)
        selectMostRecentGame(game => {
            var fen = req.params.fen;
            db.run("INSERT INTO plays (gid,fen) VALUES (?,?)", [game.id, fen]);
            res.sendStatus(200);
        });
    },
    // GET: /analyze/:gid
    analyzeGame: function(req, res) {
        console.log(`GET /analize/${req.params.gid} : analyzeGame`)
        db.all(`SELECT fen FROM plays WHERE gid = ${req.params.gid}  ORDER BY timestamp `, (err, rows) => {
            fens = rows.flatMap(r => r.fen);
            res.render("analyze", {fens: fens});
        });
    },
    // GET: /play/:gid
    setPlayingAndRedirect: function (req, res) {
        console.log(`GET /play/${req.params.gid} : setPlayingAndRedirect`)
        db.run(`UPDATE games SET playing = true WHERE id = ${req.params.gid}`, (err, rows) => {
            console.log(err)
            console.log(rows)
            res.redirect('/play')

        });

    },
    // GET: /current
    getCurrentGame: function (req, res) {
        console.log(`GET /current : setPlayingAndRedirect`)
        selectMostRecentGame( game => {
            db.all(`SELECT fen FROM plays WHERE gid = ${game.id}  ORDER BY timestamp `,
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
