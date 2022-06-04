import {Chessboard} from "/js/Chessboard.js"

var board = new Chessboard(document.getElementById("board"), {
    position: "start",
    sprite: {url: "/assets/images/chessboard-sprite-staunty.svg"},
    style: {
        aspectRatio: 0.9
    }
})
var fens = []
 var index = 0;
 var max = 0;
var current = "";
(function() {
    var poll = function() {
      $.ajax({
        url: '/current',
        dataType: 'json',
        type: 'get',
        success: function(data) { // check if available
            console.log(index, data.fens.length);
            fens = data.fens
            if( index == max) { // Most recent on last poll, check updates
                if (fens.length-1 > max) {
                    console.log(`Setting ${index}, ${fens[index]}`);
                    index = max = fens.length-1;
                    if( current != fens[index] ) {
                        board.setPosition(fens[index]);
                        current = fens[index];
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
    },
    pollInterval = setInterval(function() { // run function every 2000 ms
      poll();
      }, 300);
    poll(); // also run function on init
})();

function decrementIndex() {
    if(index > 0) {
        index -= 1;
        board.setPosition(fens[index]);
    }
}
function incrementIndex() {
    if (index < max) {
        index += 1;
        board.setPosition(fens[index]);
    }
}

document.getElementById("but-prev").onclick = decrementIndex;
document.getElementById("but-next").onclick = incrementIndex;

