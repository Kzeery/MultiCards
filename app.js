const express = require("express"),
      http    = require("http"),
      socketIO = require("socket.io"),
      objects = require("./classes/deck")

var app = express();
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

var server = http.Server(app);
var io = socketIO(server);

app.get("/", function(req, res) {
    res.render("index");
});

server.listen(3000, "127.0.0.1", function() {
    console.log("server has started!");
});
var players = {"length": 0};
var ids = [];
var deck = new objects.Deck();
deck.shuffle();
io.on('connection', function(socket) {
    socket.on('new player', function() {
        hand = deck.deal(5);
        goal = deck.deal(15);
        players[socket.id] = {
            "hand": hand,
            "goal": goal,
            "turn": false,
            "discard": {"0": [], "1": [], "2": [], "3": []}
        }
        ids.push(socket.id);
        players.length += 1
        io.sockets.emit("deal", players);
        if(players.length === 2) {
            num = Math.floor(Math.random() * 1.999);
            players[ids[num]]["turn"] = true;
            io.sockets.emit("startturn", players);
        }
    });
    socket.on("change", function(data) {
        io.emit("state", data);
        
    });
    socket.on("endturn", function(data) {
        players = data;
        for (player in players) {
            if(player !== "length") {
                players[player]["turn"] = !players[player]["turn"];
                if(players[player]["turn"]) {
                    var newCards = deck.deal(5 - players[player]["hand"].length);
                    players[player]["hand"] = players[player]["hand"].concat(newCards);
                    
                }
            }
        
        }
        io.sockets.emit("deal", players);
        io.sockets.emit("startturn", players);
        
    });
    
});

