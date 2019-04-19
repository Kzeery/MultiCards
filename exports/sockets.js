const calcEasternTime = require("../exports/easternTime"), // Calculates Eastern time zone time
Deck                  = require("../classes/deck"), // Deck class
Match                 = require("../models/match"), // MongoDB Match model
User                  = require("../models/user"), // MongoDB User model
dateFormat            = require("dateformat"), // For converting Date objects into readable strings
convertToTime         = require("./date"); // For converting miliseconds to hours, minutes, and seconds

// This is the socket listener for the game. Only users who are in a game will connect to this socket listener
function socketListener(url, io) {
    // There are more than one socket listener for these games. Each time a user connects to a game, a new socket listener for that game in the namespace of that url created.
    var listener = io.of(url);
    // The players object will have all of the user's information such as their hand, their goal deck, and their discard piles.
    var players = { "length": 0, "play": { "1": [], "2": [], "3": [], "4": [] } };
    // Creating arrays holding the mongoDB userIds of the players and the socket.ids of the players 
    var userIds = [];
    var ids = [];
    // Create and shuffle a new Deck object
    var deck = new Deck();
    deck.shuffle();
    // Instantiate some variables to be used later
    var starttime;
    var win = false;
    var now;
    listener.on('connection', function (socket) {
        // Only 2 players are allowed to connect. If a third player somehow manages to connect, send them the "fullgame" message.
        if(players.length > 1) {
            socket.emit("fullgame");
            socket.notAllowed = true;
        } else {
            if(!starttime) {
                // Getting the current time for: 1. The date to be displayed in the match history. 2. The game length to be displayed in the match history.
                starttime = Date.now();
                now = calcEasternTime();
                now = dateFormat(now, "mmmm dS, yyyy, h:MM:ss TT");
            }
            // Deak the player a hand of 5 cards initially , and a goal deck of 15 cards
            var hand = deck.deal(5);
            var goal = deck.deal(15);
            // Set them up in the players object.
            players[socket.id] = {
                hand: hand,
                goal: goal,
                turn: false,
                discard: { 0: [], 1: [], 2: [], 3: [] }
            }
            // Add their id to the socket ids and increase the length of players
            ids.push(socket.id);
            players.length += 1;
            // Send all users a message to draw their dealt cards as well as the opponents cards
            listener.emit("deal", players);

            if (players.length === 2) {
                // When the lobby is full, pick a random person to start their turn. Then send all users the "startturn" message.
                var num = Math.floor(Math.random() * 1.999);
                players[ids[num]]["turn"] = true;
                listener.emit("startturn", players);
            }
        }

        // Server getting mongoDB _id from the client and their username when they connect if it is their game.
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

        // "Change" is emitted by the sockets every single time there is a new change (ie a card gets played). It sends back data to all users prompting them to redraw the screen to reflect the change. 
        socket.on("change", function (data) {
            // Update client side players variable to match server side players variable.
            players = data["players"];
            listener.emit("state", data);
        });

        // Whenever a playing pile reaches 12, it will emit a "fullpile" message to the server.
        socket.on("fullPile", function (index) {
            // Adds all the cards in that pile to the garabge.
            deck.addGarbage(players["play"][index]);
            // Resets the pile to have nothing in it on the server side.
            players["play"][index] = [];
        });

        // "endturn" is emitted when a user ends their turn
        socket.on("endturn", function (data) {
            // Update player object on server side so that it matches client side
            players = data;
            for (player in players) {
                if (player !== "length" && player !== "play") {
                    // swap turns between players
                    players[player]["turn"] = !players[player]["turn"];
                    if (players[player]["turn"]) {
                        // The player who now has the turn is dealt more cards until they have 5 cards in their hand
                        var newCards = deck.deal(5 - players[player]["hand"].length);
                        players[player]["hand"] = players[player]["hand"].concat(newCards);
    
                    }
                }
    
            }
            // Draw the new screen with the cards and start the turn
            listener.emit("deal", players);
            listener.emit("startturn", players);
        });

        // If a user disconnects, the other user automatically wins.
        socket.on("disconnect", function() {
            // Only matters if the user is actually a valid player
            if(players[socket.id]) {
                delete players[socket.id];
            }
            if(!win && !socket.notAllowed) {
                for (player in players) {
                    if (player !== "length" && player !== "play") {
                        // Find the other player and tell them that they won
                        players[player].win = true;
                        listener.emit("gameover", players);
                        // Create a new mongoDB Match with the length of the game, and the time it started
                        var match = new Match({score: "A Player Disconnected", date: now, length: convertToTime(starttime, Date.now())});
                        // Find each user
                        for(let x = 0; x < userIds.length; x++) {
                            User.findById(userIds[x], function(err, user) {
                                if(err) {
                                    // Error handling
                                    console.log(err);
                                } else {
                                    // If they won, add their username to the match.winner, and increment their wins
                                    if(user._id != socket.userId) {
                                        match.winner = user.username;
                                        user.wins += 1;
                                    // If they lost, add their username to the match.loser, and increment their losses
                                    } else {
                                        match.loser = user.username;
                                        user.losses += 1;
                                    }
                                    // Each user has the match added to their matches array
                                    user.matches.push(match._id);
                                    user.save();
                                }
                            });
                        }
                        // Dealing with async. After 2 seconds, the match is saved and there are no more socket listeners at that location.
                        setTimeout(function() {
                            match.save();
                            listener.removeAllListeners();
                        }, 2000);
                    }
                }
            }
        });

        // If a user actually wins, they emit the "win" message
        socket.on("win", function() {
            win = true;
            // Tell all players that a player has won
            players[socket.id].win = true;
            listener.emit("gameover", players);
            // Create a new mongoDB match
            var match = new Match({length: convertToTime(starttime, Date.now()), date: now});
            // Create the score for the match. It is always going to be "15 - {the other users amount of cards}"
            ids.forEach(function(id) {
                if(id != socket.id) {
                    match.score = "15 - " +  String(15 - players[id]["goal"].length);
                }
            });
            // Find both users
            for(let x = 0; x < userIds.length; x++) {
                User.findById(userIds[x], function(err, user) {
                    if(err) {
                        // Error handling
                        console.log(err);
                    } else {
                        // If they won, add their username to the match.winner, and increment their wins
                        if(user._id == socket.userId) {
                            match.winner = user.username;
                            user.wins += 1;
                        // If they lost, add their username to the match.loser, and increment their losses
                        } else {
                            match.loser = user.username;
                            user.losses += 1;
                        }
                        // Each user has the match added to their matches array
                        user.matches.push(match._id);
                        user.save();
                    }
                });
                // Dealing with async. After 2 seconds, the match is saved and there are no more socket listeners at that location.
                setTimeout(function() {
                    match.save();
                    listener.removeAllListeners();
                }, 2000)
            }
        });
    
    });
}

// Exporting this to be used in mainsockets.js
module.exports = socketListener;