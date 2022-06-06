import {Chessboard} from "/js/Chessboard.js"

var board = new Chessboard(document.getElementById("board"), {
    position: "start",
    sprite: {url: "/assets/images/chessboard-sprite-staunty.svg"},
    style: {
        aspectRatio: 0.9
    }
})
var fens = []
var scores = []
var index = 0;
var max = 0;
var current = "";



function openPromoModal(turn) {
    console.log('OPEN MODAL')
    var wpieces = document.getElementById('wchoose')
    var bpieces = document.getElementById('bchoose')

    if (turn % 2 == 0) {
        bpieces.style.display = 'none';
        wpieces.style.display = '';
    } else {
        wpieces.style.display = 'none';
        bpieces.style.display = '';
    }
    $("#promoModal").modal('show')
}

function setScore(score) {
    document.getElementById('score').innerText = score
}

function poll() {
  $.ajax({
    url: '/current',
    dataType: 'json',
    type: 'get',
    success: function(data) { // check if available
        if(data.interaction) return openPromoModal(max)
        fens = data.fens
        scores = data.scores
        if( index == max) { // Most recent on last poll, check updates
            if (fens.length-1 > max) {
                console.log(`Setting ${index}, ${fens[index]}`);
                index = max = fens.length-1;
                if( current != fens[index] ) {
                    board.setPosition(fens[index]);
                    current = fens[index];
                    setScore(scores[index])
                } else {
                    console.log("SAME POS!!")
                }
            }
        }
        if ( false ) { // end of game?
            clearInterval(pollInterval); // optional: stop poll function
        }
    },
    error: function() { // error logging
        console.log('Error!');
        window.location.replace('/');
    }
  });

}
var pollInterval = setInterval(poll, 300);
poll(); // also run function on init


function decrementIndex() {
    if(index > 0) {
        index -= 1;
        board.setPosition(fens[index]);
        setScore(scores[index])
    }
}
function incrementIndex() {
    if (index < max) {
        index += 1;
        board.setPosition(fens[index]);
        setScore(scores[index])
    }
}

document.getElementById("but-prev").onclick = decrementIndex;
document.getElementById("but-next").onclick = incrementIndex;

