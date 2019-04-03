var socket = io.connect(window.location.href);
socket.emit("new player");
function drawCard(url, classname = null, value = null, append = true) {
    str = "<span class='card' style='background-image: url(" + url + ");'"
    if (value) {
        str += "num='" + value
    }
    str += "'></span>";
    if (append) {
        $("." + classname).append(str);
    } else {
        return str
    }

}
var otherSocket;
var playersSend = {};

socket.on('deal', function (players) {
    $(".enemy .card").remove();
    $(".you .card").remove();
    players[socket.id].hand.forEach(function (card) {
        drawCard(card.url, "you", card.value);
    });
    $(".you").append("<span class='card goal ml-5' style='background-image: url(" + players[socket.id]["goal"][0].url + ");' num='" + players[socket.id]["goal"][0].value + "'></span>");
    if (players.length > 1) {
        if (otherSocket) {
            for (var i = 0; i < players[otherSocket]["hand"].length; i++) {
                drawCard("../cards/back.jpg", "enemy");
            }
        } else {
            for (var i = 0; i < 5; i++) {
                drawCard("../cards/back.jpg", "enemy");
            }
        }
        for (x in players) {
            if (x !== "length" && x !== socket.id && x !== "play") {
                otherSocket = x;
                $(".enemy").append("<span class='card goal ml-5' style='background-image: url(" + players[x]["goal"][0].url + ");' num='" + players[x]["goal"][0].value + "'></span>");
            }
        }
    }
});

socket.on("startturn", function (players) {
    if (players[socket.id]["turn"]) {
        $(".you").on('click', function (e) {
            if ($(e.target).hasClass("selected")) {
                $(e.target).removeClass("selected");
            } else {
                if (e.target !== this) {
                    if ($(".selected").length) {
                        $(".selected").removeClass("selected");
                    }
                    $(e.target).addClass("selected");
                }
            }

        });
        $(".you-disc").on('click', function (e) {
            if ($(e.target).hasClass("selected")) {
                $(e.target).removeClass("selected");
            } else {
                if ($(e.target).hasClass("card")) {
                    if (!$(".selected").length) {
                        $(e.target).addClass("selected");
                        e.stopPropagation();
                    }
                }
            }
        })
        $(".send").on('click', function (e) {
            if (e.target !== this) {
                if ($(".selected").length) {
                    if ($(e.target).hasClass("you-discard") && !$(".selected").hasClass("goal") && $(".selected").length && !$(".selected").hasClass("you-discard")) {
                        // Discarding card code block
                        var index = $(e.target).index();
                        var str = "<span class='card you-discard' style='background-image: url(" + "../cards/" + $(".selected").attr("num") + ".jpg" + ");' num='" + $(".selected").attr("num") + "'></span>"
                        $(e.target).replaceWith(str);
                        players[socket.id]["discard"][String(index)].push(players[socket.id]["hand"].splice($(".selected").index(), 1)[0]);
                        $(".selected").remove();
                        $("button").removeAttr("disabled");
                        socket.emit("change", { "play": $(".play").html(), "en-disc": $(".you-disc").html(), "id": socket.id, "hand": true, "players": players });
                        socket.emit("endturn", players);
                        $(".you").unbind();
                        $(".you-disc").unbind();
                        $(".send").unbind();
                    } else if (($(".selected").attr("num") === "pass" && $(e.target).attr("num")) || (Number($(".selected").attr("num")) === Number($(e.target).attr("num")) + 1)) {
                        var fullPile = false;
                        if ($(".selected").attr("num") === "pass") {
                            var str = drawCard("../cards/pass.jpg", "", String(Number($(e.target).attr("num")) + 1), false);
                        } else {
                            var str = drawCard("../cards/" + $(".selected").attr("num") + ".jpg", "", $(".selected").attr("num"), false);
                        }
                        var index = String($(e.target).index());
                        if($(e.target).attr("num") === "11") {
                            $(e.target).replaceWith('<span class="no-card" num="0"></span>');
                            fullPile = true;
                        } else {
                            $(e.target).replaceWith(str);
                        }
                        if ($(".selected").hasClass("goal")) {
                            players["play"][index].push(players[socket.id]["goal"].shift());
                            if(fullPile) {
                                socket.emit("fullPile", index)
                                players["play"][index] = [];
                            }
                            if (players[socket.id]["goal"].length === 0) {
                                socket.emit("win");
                            } else {
                                $(".selected").replaceWith("<span class='card goal ml-5' style='background-image: url(" + players[socket.id]["goal"][0].url + ");' num='" + players[socket.id]["goal"][0].value + "'></span>");
                                socket.emit("change", { "play": $(".play").html(), "en-disc": $(".you-disc").html(), "id": socket.id, "hand": false, "players": players });
                            }
                        } else if ($(".selected").hasClass("you-discard")) {
                            players["play"][index].push(players[socket.id]["discard"][$(".selected").index()].pop());
                            if(fullPile) {
                                socket.emit("fullPile", index)
                                players["play"][index] = [];
                            }
                            if (players[socket.id]["discard"][$(".selected").index()].length === 0) {
                                $(".selected").replaceWith("<span class='no-card you-discard'></span>");
                            } else {
                                $(".selected").replaceWith("<span class='card you-discard' style='background-image: url(" + players[socket.id]["discard"][$(".selected").index()][0].url + ");' num='" + players[socket.id]["discard"][$(".selected").index()][0].value + "'></span>");
                            }
                            socket.emit("change", { "play": $(".play").html(), "en-disc": $(".you-disc").html(), "id": socket.id, "hand": false, "players": players });
                        } else {
                            players["play"][index].push(players[socket.id]["hand"].splice($(".selected").index(), 1));
                            if(fullPile) {
                                socket.emit("fullPile", index)
                                players["play"][index] = [];
                            }
                            $(".selected").remove();
                            socket.emit("change", { "play": $(".play").html(), "en-disc": $(".you-disc").html(), "id": socket.id, "hand": true, "players": players });
                        }
                        if (players[socket.id]["hand"].length === 0) {
                            socket.emit("endturn", players);
                            $(".you").unbind();
                            $(".you-disc").unbind();
                            $(".send").unbind();
                        }
                    }
                }
            }
        });
    }
});

socket.on("state", function (data) {
    if (data["id"] !== socket.id) {
        $(".play").html(data["play"]);
        $(".en-disc").html(data["en-disc"]);
        if (data["hand"]) {
            $(".enemy .card:first").remove();
        } else {
            $(".enemy .goal").replaceWith("<span class='card goal ml-5' style='background-image: url(" + data["players"][otherSocket]["goal"][0].url + ");' num='" + data["players"][otherSocket]["goal"][0].value + "'></span>");
        }
    }
});

