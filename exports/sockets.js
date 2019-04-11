const objects = require("../classes/deck");
      
function makeurls(num) {
    var urls = [];
    for(let x = 0; x < num; x++) {
        urls.push(Math.random().toString(36).substring(2, 15));
    }
    return urls
}


function socketListener(url, io) {
    var listener = io.of(url);
    var players = { "length": 0, "play": { "1": [], "2": [], "3": [], "4": [] } };
    var ids = [];
    var deck = new objects.Deck();
    deck.shuffle();
    listener.on('connection', function (socket) {
        socket.on('new player', function () {
            console.log("new player");
            hand = deck.deal(5);
            goal = deck.deal(15);
            players[socket.id] = {
                "hand": hand,
                "goal": goal,
                "turn": false,
                "discard": { "0": [], "1": [], "2": [], "3": [] }
            }
            ids.push(socket.id);
            players.length += 1;
            listener.emit("deal", players);
            if (players.length === 2) {
                num = Math.floor(Math.random() * 1.999);
                players[ids[num]]["turn"] = true;
                listener.emit("startturn", players);
            }
        });
        socket.on("change", function (data) {
            players = data["players"];
            listener.emit("state", data);
        });
        socket.on("fullPile", function (index) {
            deck.addGarbage(players["play"][index]);
            players["play"][index] = [];
        });
        socket.on("endturn", function (data) {
            players = data;
            for (player in players) {
                if (player !== "length" && player !== "play") {
                    players[player]["turn"] = !players[player]["turn"];
                    if (players[player]["turn"]) {
                        var newCards = deck.deal(5 - players[player]["hand"].length);
                        players[player]["hand"] = players[player]["hand"].concat(newCards);
    
                    }
                }
    
            }
            listener.emit("deal", players);
            listener.emit("startturn", players);
    
        });
        socket.on("disconnect", function() {
            console.log("disconnected!");
            delete players[socket.id];
            players.length -= 1;
        });
        socket.on("win", function() {
            console.log("won!");
        })
    
    });
}

module.exports = {makeurls, socketListener};