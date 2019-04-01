var socket = io();
socket.emit("new player");

function drawCard(url, classname=null, value=null, append=true) {
    str = "<span class='card' style='background-image: url(" + url + ");'"
    if(value) {
        str += "num='" + value
    }
    str += "'></span>";
    if(append) {
        $("." + classname).append(str);
    } else {
        return str
    }
   
}
var otherSocket;
var playersSend = {};

socket.on('deal', function(players) {
    $(".enemy .card").remove();
    $(".you .card").remove();
    players[socket.id].hand.forEach(function(card) {
        drawCard(card.url, "you", card.value);
    });
    $(".you").append("<span class='card goal ml-5' style='background-image: url(" + players[socket.id]["goal"][0].url + ");' num='" + players[socket.id]["goal"][0].value + "'></span>");
    // drawCard(players[socket.id]["goal"][0].url, "you", players[socket.id]["goal"][0].url);
    if(players.length > 1) {
        if(otherSocket) {
            for(var i = 0; i < players[otherSocket]["hand"].length; i++) {
                drawCard("../cards/back.jpg", "enemy");
            }
        } else {
            for(var i = 0; i < 5; i++) {
                drawCard("../cards/back.jpg", "enemy");
            }
        }
        for (x in players) {
            if(x !== "length" && x !== socket.id) {
                otherSocket = x;
                $(".enemy").append("<span class='card goal ml-5' style='background-image: url(" + players[x]["goal"][0].url + ");' num='" + players[x]["goal"][0].value + "'></span>");
                // drawCard(players[x]["goal"][0].url, "enemy", players[x]["goal"][0].url);
            }
        }
    }
});

    socket.on("startturn", function(players) {
        if(players[socket.id]["turn"]) {
            $(".you").on('click', function(e) {
                if($(e.target).hasClass("selected")) {
                    $(e.target).removeClass("selected");
                } else {
                    if(e.target !== this) {
                        if($(".selected").length) {
                            $(".selected").removeClass("selected");
                        }
                        $(e.target).addClass("selected");
                    } 
                }
                
            });
            $(".you-disc").on('click', function(e) {
                if($(e.target).hasClass("selected")) {
                    $(e.target).removeClass("selected");
                } else {
                    if($(e.target).hasClass("card")) {
                        if(!$(".selected").length) {
                            $(e.target).addClass("selected");
                            e.stopPropagation();
                        } 
                    }
                }
            })
            $(".send").on('click', function(e) {
                if(e.target !== this) {
                    if($(".selected").length) {
                        if(($(".selected").attr("num") === "pass" && $(e.target).attr("num")) || (Number($(".selected").attr("num")) === Number($(e.target).attr("num")) + 1)) {
                            console.log("here1!");
                            if($(".selected").attr("num") === "pass") {
                                str = drawCard("../cards/pass.jpg", "", String(Number($(e.target).attr("num")) + 1), false);
                            } else {
                                str = drawCard("../cards/" + $(".selected").attr("num") + ".jpg", "", $(".selected").attr("num"), false);
                            }
                            $(e.target).replaceWith(str);
                            if($(".selected").hasClass("goal")) {
                                players[socket.id]["goal"].shift();
                                $(".selected").replaceWith("<span class='card goal ml-5' style='background-image: url(" + players[socket.id]["goal"][0].url + ");' num='" + players[socket.id]["goal"][0].value + "'></span>");
                                socket.emit("change", {"play": $(".play").html(), "en-disc": $(".you-disc").html(), "id": socket.id, "hand": false, "players": players});
                            } else {
                                players[socket.id]["hand"].splice($(".selected").index(), 1);
                                $(".selected").remove();
                                socket.emit("change", {"play": $(".play").html(), "en-disc": $(".you-disc").html(), "id": socket.id, "hand": true, "players": players});
                            }
                        } 
                        if($(e.target).hasClass("you-discard") && !$(".selected").hasClass("goal") && $(".selected").length) {
                                var index = $(e.target).index();
                                str = "<span class='card you-discard' style='background-image: url(" + "../cards/" + $(".selected").attr("num") + ".jpg" + ");' num='" + $(".selected").attr("num") + "'></span>"
                                $(e.target).replaceWith(str);
                                players[socket.id]["discard"][String(index)].push(players[socket.id]["hand"].splice($(".selected").index(), 1)[0]);
                                $(".selected").remove();
                                $("button").removeAttr("disabled");
                                socket.emit("change", {"play": $(".play").html(), "en-disc": $(".you-disc").html(), "id": socket.id, "hand": true, "players": players});
                                socket.emit("endturn", players);
                                $(".you").unbind();
                                $(".you-disc").unbind();
                                $(".send").unbind();
                        }
                    }
                }
            });
        }
    });

socket.on("state", function(data) {
    if(data["id"] !== socket.id) {
        $(".play").html(data["play"]);
        $(".en-disc").html(data["en-disc"]);
        if(data["hand"]) {
            $(".enemy .card:first").remove();
        } else {
            $(".enemy .goal").replaceWith("<span class='card goal ml-5' style='background-image: url(" + data["players"][otherSocket]["goal"][0].url + ");' num='" + data["players"][otherSocket]["goal"][0].value + "'></span>");
        }
    }
});

