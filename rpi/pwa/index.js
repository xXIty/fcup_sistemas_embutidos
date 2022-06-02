const express = require("express");
const path = require("path");
const app = express();
const be = require("./backend/backend.js")

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public/views'))
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

// ROUTES

app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "public/index.html"));
});


app.get("/play/:gid", function (req, res) {
    be.setPlayingAndRedirect(req, res);
});

app.get("/play", function (req, res) {
    res.sendFile(path.join(__dirname, "public/play.html"));
});

app.post("/fen", function (req, res) {
    be.addNewFen(req, res);
});


app.get("/analyze", function (req, res) {
    be.showAllGames(req, res);
});
app.get("/analyze/:gid", function(req, res) {
    be.analyzeGame(req, res);
});

app.post("/game/new", function (req, res) {
    be.createNewGameAndRedirect(req, res);

});

app.post("/game/:gid/delete", function (req, res) {
    be.deleteGameById(req, res);
});
app.post("/game/:gid/edit", function (req, res) {
    be.editGameById(req, res);
});

app.get("/current", function (req, res) {
    be.getCurrentGame(req, res);
     
});

//setTimeout(checkGame, DELAY)
app.listen(8000, () => console.log("Server is running on Port 8000"));
