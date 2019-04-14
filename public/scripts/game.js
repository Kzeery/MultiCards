function listenerfunction(e) {
    var confirmationMessage = 'You are currently in a game.';

    (e || window.event).returnValue = confirmationMessage; //Gecko + IE
    return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
}
window.addEventListener("beforeunload", listenerfunction);

$(function() {
    var socket = io.connect(window.location.href);
    socket.on("connect", function() {
        if($("#userid").length) {
            socket.userId = $("#userid").attr("userid");
            socket.emit("newsocket", socket.userId);
        }
    });
    socket.on("fullgame", function() {
        socket.removeAllListeners();
        return $("body").html('<div class="container mt-5"><div><h1>This is not your game. You cannot join it. </h1></div><div><a class="btn btn-danger" href="/">Back</a></div>');
    });
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
    var updatedPlayers;
    $(".game").on('mouseenter', ".card.you-discard", function() {
        var el = $('<span class="tooltip1"><ul class="list-group"></ul></span>')
        var count = updatedPlayers[socket.id]["discard"][String($(this).index())].length + 1;
        for(let i = 0; i < updatedPlayers[socket.id]["discard"][String($(this).index())].length; i++) {
            if(i === updatedPlayers[socket.id]["discard"][String($(this).index())].length - 1) {
                el.prepend("<li class='list-group-item active'>" + "Top Card: " + updatedPlayers[socket.id]["discard"][String($(this).index())][i].value + "</li>")
            } else {
                el.prepend("<li class='list-group-item'>" + "Card #" + String(--count) + ": "+ updatedPlayers[socket.id]["discard"][String($(this).index())][i].value + "</li>")
            }
        }
        $(this).append(el);
    }).on('mouseleave', '.card.you-discard', function() {
        $(".tooltip1").remove();
    });
    $(".game").on('mouseenter', ".card.enemy-discard", function() {
        var el = $('<span class="tooltip1"><ul class="list-group"></ul></span>')
        var count = updatedPlayers[otherSocket]["discard"][String($(this).index())].length + 1;
        for(let i = 0; i < updatedPlayers[otherSocket]["discard"][String($(this).index())].length; i++) {
            if(i === updatedPlayers[otherSocket]["discard"][String($(this).index())].length - 1) {
                el.prepend("<li class='list-group-item active'>" + "Top Card: " + updatedPlayers[otherSocket]["discard"][String($(this).index())][i].value + "</li>")
            } else {
                el.prepend("<li class='list-group-item'>" + "Card #" + String(--count) + ": "+ updatedPlayers[otherSocket]["discard"][String($(this).index())][i].value + "</li>")
            }
        }
        $(this).append(el);
    }).on('mouseleave', '.card.enemy-discard', function() {
        $(".tooltip1").remove();
    });
    $(".game").on("mouseenter", ".goal", function() {
        if($(this).parent().hasClass("you")) {
            var el = '<span class="tooltip1"><ul class="list-group"><li class="list-group-item active">Cards left: ' + updatedPlayers[socket.id]["goal"].length + '</li></ul></span>'
        } else {
            var el = '<span class="tooltip1"><ul class="list-group"><li class="list-group-item active">Cards left: ' + updatedPlayers[otherSocket]["goal"].length + '</li></ul></span>'
        }
        $(this).append($(el));
    }).on("mouseleave", ".goal", function() {
        $(".tooltip1").remove();
    });

    $(".game").on("mouseenter", ".play .card", function() {
        var el = '<span class ="tooltip1"><ul class="list-group"><li class="list-group-item active">Top Card Value: ' + $(this).attr("num") + '</li></ul></span>'
        $(this).append($(el)) 
    }).on("mouseleave", ".play .card", function() {
        $(".tooltip1").remove();
    });
    $(".game .btn-danger").hide();
    
    function notify(text) {
        var el = $('<div class="tn-box tn-box-color-1"><p class="notification-message">' + text + '</p><button class="closebutton btn btn-success">OK</button></div>')
        $(".notifications").append(el);
        setTimeout(function() {
            el.addClass("tn-box-active");
            el.fadeOut(3000, function() {
                $(this).remove();
            });
        }, 300);
    }
    var otherSocket;

    socket.on('deal', function (players) {
        updatedPlayers = players;
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
        updatedPlayers = players;
        if (players[socket.id]["turn"]) {
            var discarded;
            $(".game .btn-danger").click(function() {
                socket.emit("endturn", players);
                $(".you").off();
                $(".you-disc").off();
                $(".send").off();
                $(".game .btn-danger").off();
                $(".game .btn-danger").hide();
            });
            notify("It is now your turn!");
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
            });
            $(".send").on('click', function (e) {
                if (e.target !== this) {
                    if ($(".selected").length) {
                        if ($(".selected").length && $(e.target).hasClass("you-discard") && !$(".selected").hasClass("goal") && !$(".selected").hasClass("you-discard")) {
                            if(!discarded) {
                                var index = $(e.target).index();
                                var str = "<span class='card you-discard turn-discard' style='background-image: url(" + "../cards/" + $(".selected").attr("num") + ".jpg" + ");' num='" + $(".selected").attr("num") + "'></span>"
                                $(e.target).replaceWith(str);
                                players[socket.id]["discard"][String(index)].push(players[socket.id]["hand"].splice($(".selected").index(), 1)[0]);
                                $(".selected").remove();
                                $("button").removeAttr("disabled");
                                updatedPlayers = players;
                                socket.emit("change", { "play": $(".play").html(), "en-disc": $(".you-disc").html(), "id": socket.id, "hand": true, "players": players });
                                discarded =true;
                                $(".game .btn-danger").show();
                            }
                        } else if ((($(".selected").attr("num") === "pass" && $(e.target).attr("num")) || (Number($(".selected").attr("num")) === Number($(e.target).attr("num")) + 1)) && !$(".selected").hasClass("turn-discard")) {
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
                                    $(".selected").replaceWith('<span class="no-card" num="0"></span>');
                                    updatedPlayers = players;
                                    socket.emit("change", { "play": $(".play").html(), "en-disc": $(".you-disc").html(), "id": socket.id, "hand": false, "players": players });
                                    socket.emit("win");
                                } else {
                                    $(".selected").replaceWith("<span class='card goal ml-5' style='background-image: url(" + players[socket.id]["goal"][0].url + ");' num='" + players[socket.id]["goal"][0].value + "'></span>");
                                    updatedPlayers = players;
                                    socket.emit("change", { "play": $(".play").html(), "en-disc": $(".you-disc").html(), "id": socket.id, "hand": false, "players": players });
                                }
                            } else if ($(".selected").hasClass("you-discard")) {
                                players["play"][index].push(players[socket.id]["discard"][$(".selected").index()].pop());
                                if(fullPile) {
                                    socket.emit("fullPile", index)
                                    players["play"][index] = [];
                                }
                                updatedPlayers = players;
                                if (players[socket.id]["discard"][$(".selected").index()].length === 0) {
                                    $(".selected").replaceWith("<span class='no-card you-discard'></span>");
                                } else {
                                    $(".selected").replaceWith("<span class='card you-discard' style='background-image: url(" + players[socket.id]["discard"][$(".selected").index()][players[socket.id]["discard"][$(".selected").index()].length - 1].url + ");' num='" + players[socket.id]["discard"][$(".selected").index()][players[socket.id]["discard"][$(".selected").index()].length - 1].value + "'></span>");
                                }
                                socket.emit("change", { "play": $(".play").html(), "en-disc": $(".you-disc").html(), "id": socket.id, "hand": false, "players": players });
                            } else {
                                players["play"][index].push(players[socket.id]["hand"].splice($(".selected").index(), 1));
                                if(fullPile) {
                                    socket.emit("fullPile", index)
                                    players["play"][index] = [];
                                }
                                updatedPlayers = players;
                                $(".selected").remove();
                                socket.emit("change", { "play": $(".play").html(), "en-disc": $(".you-disc").html(), "id": socket.id, "hand": true, "players": players });
                            }
                            if(players[socket.id]["hand"].length === 0) {
                                $(".game .btn-danger").show();
                            }
                        }
                    }
                }
            });
        } else {
            notify("It is now your opponent's turn!");
        }
    });
    
    socket.on("state", function (data) {
        updatedPlayers = data.players;
        if (data.id !== socket.id) {
            $(".play").html(data.play);
            $(".en-disc").html(data["en-disc"]);
            $(".en-disc .you-discard").each(function() {
                $(this).removeClass("you-discard");
                $(this).addClass("enemy-discard");
            });
            $(".turn-discard").removeClass("turn-discard");
            if (data["hand"]) {
                $(".enemy .card:first").remove();
            } else {
                $(".enemy .goal").replaceWith("<span class='card goal ml-5' style='background-image: url(" + data["players"][otherSocket]["goal"][0].url + ");' num='" + data["players"][otherSocket]["goal"][0].value + "'></span>");
            }
        }
    });
    socket.on("gameover", function(players) {
        updatedPlayers = players;
        $(".game").find("*").off();
        $(".game").off();
        window.removeEventListener("beforeunload", listenerfunction);
        if(players[socket.id].win) {
            $("body").append('<div class="gameover"><h1 class="mt-5">You won!</h1><h3 class="mt-5">Good job, your mom must be proud!</h3><h3 class="mt-3">To go back to the home page, click the button below.</h3><a href="/" class="btn btn-success mt-5">Click Here to go Home</a></div>');
        } else {
            $("body").append('<div class="gameover"><h1 class="mt-5">You lost!</h1><h3 class="mt-5">Too bad, better luck next time!</h3><h3 class="mt-3">To go back to the home page, click the button below.</h3><a href="/" class="btn btn-success mt-5">Click Here to go Home</a></div>');
        }
    });
});


