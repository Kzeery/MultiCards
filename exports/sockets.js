const objects = require("../classes/deck"),
User            = require("../models/user"),
Match           = require("../models/match"),
convertToTime   = require("./date");
mongoose        = require("mongoose");


function socketListener(url, io) {
    var listener = io.of(url);
    var players = { "length": 0, "play": { "1": [], "2": [], "3": [], "4": [] } };
    var userIds = [];
    var ids = [];
    var deck = new objects.Deck();
    deck.shuffle();
    var starttime;
    var win = false;
    listener.on('connection', function (socket) {
        if(players.length > 1) {
            socket.emit("fullgame");
            socket.notAllowed = true;
        } else {
            if(!starttime) {
                starttime = Date.now();
            }
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
            if(!socket.notAllowed) {
                socket.userId = id;
                userIds.push(id);
                User.findById(id, function(err, user) {
                    if(err) {
                        console.log(err);
                    } else {
                        socket.username = user.username;
                    }
                });
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
            if(players[socket.id]) {
                delete players[socket.id];
            }
            if(!win && !socket.notAllowed) {
                for (player in players) {
                    if (player !== "length" && player !== "play") {
                        players[player].win = true;
                        listener.emit("gameover", players);
                        var match = new Match({score: "A Player Disconnected", length: convertToTime(starttime, Date.now())});
                        for(let x = 0; x < userIds.length; x++) {
                            User.findById(userIds[x], function(err, user) {
                                if(err) {
                                    console.log(err);
                                } else {
                                    if(user._id != socket.userId) {
                                        match.winner = user.username;
                                        user.wins += 1;
                                    } else {
                                        match.loser = user.username;
                                        user.losses += 1;
                                    }
                                    user.matches.push(match._id);
                                    user.save();
                                }
                            });
                        }
                        setTimeout(function() {
                            match.save();
                            listener.removeAllListeners();
                        }, 5000);
                    }
                }
            }
        });
        socket.on("win", function() {
            players[socket.id].win = true;
            listener.emit("gameover", players);
            var match = new Match({length: convertToTime(starttime, Date.now())});
            ids.forEach(function(id) {
                if(id != socket.id) {
                    match.score = "15 - " +  String(15 - players[socket.id]["hand"].length)
                }
            });
            var saved  = false;
            for(let x = 0; x < userIds.length; x++) {
                User.findById(userIds[x], function(err, user) {
                    if(err) {
                        console.log(err);
                    } else {
                        if(user._id == socket.userId) {
                            match.winner = user.username;
                            user.wins += 1;
                        } else {
                            match.loser = user.username;
                            user.losses += 1;
                        }
                        user.matches.push(match._id);
                        user.save();
                    }
                });
                setTimeout(function() {
                    match.save();
                    listener.removeAllListeners();
                }, 5000)
            }
        });
    
    });
}

module.exports = {socketListener};