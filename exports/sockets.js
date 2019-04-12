const objects = require("../classes/deck"),
User            = require("../models/user"),
Match           = require("../models/match"),
mongoose        = require("mongoose");


function socketListener(url, io) {
    var listener = io.of(url);
    var players = { "length": 0, "play": { "1": [], "2": [], "3": [], "4": [] } };
    var userIds = [];
    var ids = [];
    var deck = new objects.Deck();
    deck.shuffle();
    listener.on('connection', function (socket) {
        if(players.length > 1) {
            socket.emit("fullgame");
        } else {
            var hand = deck.deal(5);
            var goal = deck.deal(15);
            players[socket.id] = {
                hand: hand,
                goal: goal,
                turn: false,
                discard: { 0: [], 1: [], 2: [], 3: [] }
            }
            ids.push(socket.id);
            players.length += 1;
            listener.emit("deal", players);
            if (players.length === 2) {
                var num = Math.floor(Math.random() * 1.999);
                players[ids[num]]["turn"] = true;
                listener.emit("startturn", players);
            }
        }
        socket.on("newsocket", function(id) {
            socket.userId = id;
            userIds.push(id);
            User.findById(id, function(err, user) {
                if(err) {
                    console.log(err);
                } else {
                    socket.username = user.username;
                }
            });
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
            if(players[socket.id]) {
                delete players[socket.id];
            }
            for (player in players) {
                if (player !== "length" && player !== "play") {
                    players[player].win = true;
                    listener.emit("gameover", players);
                    var thismatch = {_id: new mongoose.Types.ObjectId(), Score: "A Player Disconnected"}
                    userIds.forEach(function(id) {
                        if(id !== socket.userId) {
                            thismatch.winner = id;
                        } else {
                            thismatch.loser = id;
                        }
                    });
                    Match.create(thismatch, function(err, match) {
                        if(err) {
                            console.log(err);
                        } else {
                            userIds.forEach(function(id) {
                                User.findById(id, function(err, user) {
                                    if(err) {
                                        console.log(err)
                                    } else {
                                        user.matches.push(match);
                                        user.save();
                                    }
                                })
                            });
                        }
                    });
                    
                    // userIds = [];
                    // ids = [];
                    // deck = new objects.Deck();
                    // deck.shuffle();
                    // players = { "length": 0, "play": { "1": [], "2": [], "3": [], "4": [] } };
                }
            }
            listener.removeAllListeners();
        });
        socket.on("win", function() {
            players[socket.id].win = true;
            listener.emit("gameover", players);
            ids = [];
            deck = new objects.Deck();
            deck.shuffle();
            players = { "length": 0, "play": { "1": [], "2": [], "3": [], "4": [] } };
            listener.removeAllListeners();
        });
    
    });
}

module.exports = {socketListener};