const express = require("express");
const path = require("path");
const app = express();
const sqlite3 = require("sqlite3");

const db = new sqlite3.Database("db.sqlite", (err) => {
  if (err) {
    // Cannot open database
    console.error(err.message);
    throw err;
  } else {
    console.log("Connected to the SQLite database.");
  }
});

db.run(
  `CREATE TABLE games (id INTEGER PRIMARY KEY AUTOINCREMENT, name text,Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)`,
  (err) => {
    if (err) {
      console.log(err)
      // Table already created
    } else {
      // Table just created, creating some rows
    }
  }
);
db.run(
  `CREATE TABLE plays (id INTEGER PRIMARY KEY AUTOINCREMENT, fen text NOT NULL, Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, gid INTEGER NOT NULL, FOREIGN KEY (gid) REFERENCES games (id))`,
  (err) => {
    if (err) {
      console.log(err)
      // Table already created
    } else {
      // Table just created, creating some rows
    }
  }
);

var game = {};
var fens = []
function getGameFens(gid) {
    if (gid == undefined) return fens
    db.all(`SELECT fen FROM plays WHERE gid = ${gid}  ORDER BY Timestamp DESC `,
            (err, rows)=> {
                fens = rows.flatMap(r => r.fen);
                return fens
            });
    return fens
}

function mostRecentGame() {
    db.get("SELECT id FROM games ORDER BY Timestamp DESC", (err, row)=>{
        game = row
        return row;
    });
    return game
    
}

// Long Polling || timout freq >> play moves freq

const DELAY = 300

end_of_game = true
connections = []
last = 0
var fires = 0

function chooseFen(req) {
    return 0
}

function checkGame() {
    g = mostRecentGame()
    console.log(g)
    fens = getGameFens(g.id)
    console.log(fens)
    current = 0; 
    var modified = fens[current] != fens[last];
    console.log(modified)
    last = current
    end_of_game = false

    if (modified || fires > 120) {
        connections.map(res => {
            // noPushingResponse()
            //res.render("play", {fen: fens[chooseFen(req)], push: false});
            console.log(`RENDERING ${fens[0]}`)
            res.render("board", {fen: fens[0]});
        })
        connections = []
        fires = 0
    }
    fires = fires + 1

//        connections.map(res => {
//            // pushingResponse()
//            //res.render("play", {fen: fens[chooseFen(req)], push: true});
//            console.log("PUSH")
//            res.sendFile(path.join(__dirname, "public/play.html"));
//        });
    setTimeout(checkGame, DELAY)
}
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public/views'))
app.use(express.static(path.join(__dirname, "public")));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/play/new", function (req, res) {

    var insert = "INSERT INTO games (name) VALUES (?)";
    db.run(insert, ["new_game"], (err) => {
        console.log(`Inserting: ${err}`);

    });

    db.get("SELECT id FROM games ORDER BY Timestamp DESC", (err, row)=>{
        console.log(row);
        var fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
        db.run("INSERT INTO plays (gid,fen) VALUES (?,?)", [row.id, fen]);
        res.redirect('/play/'+row.id);
    });
});

app.get("/play/:gid", function (req, res) {
    res.sendFile(path.join(__dirname, "public/play.html"));
});

app.post("/play", function (req, res) {

    db.get("SELECT id FROM games ORDER BY Timestamp DESC", (err, row)=>{
        console.log(row);
        var fen = req.params.fen;
        db.run("INSERT INTO plays (gid,fen) VALUES (?,?)", [row.id, fen]);
        res.redirect('play/'+ row.id);
    });
});

app.get("/board", function (req, res) {
    res.setHeader("Content-Type", "text/html; charset=utf-8")
    res.setHeader("Transfer-Encoding", "chunked")
    
    connections.push(res)
});

app.get("/analyze/:gid", function(req, res) {
    db.all(`SELECT fen FROM plays WHERE gid = ${req.params.id}  ORDER BY Timestamp DESC `, (err, rows) => {
        console.log(rows);
        res.render("analyze", {fens: rows});
    });
});

app.get("/current", function (req, res) {
    db.get("SELECT id FROM games ORDER BY Timestamp DESC", (err, row)=>{
        db.all(`SELECT fen FROM plays WHERE gid = ${row.id}  ORDER BY Timestamp DESC `,
                (err, rows)=> {
                    fens = rows.flatMap(r => r.fen);
                    res.json(fens)
                });
    });
        
    });

//setTimeout(checkGame, DELAY)
app.listen(8000, () => console.log("Server is running on Port 8000"));
