// A function that gives the page a warning before leaving
function listenerfunction(e) {
    var confirmationMessage = 'You are currently in a game.';

    (e || window.event).returnValue = confirmationMessage; //Gecko + IE
    return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
}

// Warning the user before leaving the page
window.addEventListener("beforeunload", listenerfunction);

$(function() {
    // Connect to the socket listener of the current url
    var socket = io.connect(window.location.href);
    socket.on("connect", function() {
        // Making sure the person connected is logged in, and sending the mongoDB _id to the server
        if($("#userid").length) {
            socket.userId = $("#userid").attr("userid");
            socket.emit("newsocket", socket.userId);
        }
    });

    // If the game is full, that likely means that the user should not be joining. Remove all the listeners and replace the html with an error message
    socket.on("fullgame", function() {
        socket.removeAllListeners();
        return $("body").html('<div class="container mt-5"><div><h1>This is not your game. You cannot join it. </h1></div><div><a class="btn btn-danger" href="/">Back</a></div>');
    });

    // Function for drawing a card on the screen using the url of the card for the background image;
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

    // An unlocal variable that changes each time the players variable updates
    var updatedPlayers;

    // All of the mouseenter/mouseleave listeners are to add tooltips.
    // // The .card.you-discard listener adds a tooltip that indicates the top card of the discard piles and what cards are under it for your own discard piles
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

    // // The .card.enemy-discard listener adds a tooltip that indicates the top card of the discard piles and what cards are under it for your opponent's discard piles
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

    // // The .goal listener adds a tooltip that indicates how many cards are left in your or your opponent's goal deck
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

    // // The .play .card listener adds a tooltip that indicates the value of the top card in a playing pile. This is useful for when a "Pass" card is on top, because it can take on any value so it may be hard to remember what it is
    $(".game").on("mouseenter", ".play .card", function() {
        var el = '<span class ="tooltip1"><ul class="list-group"><li class="list-group-item active">Top Card Value: ' + $(this).attr("num") + '</li></ul></span>'
        $(this).append($(el)) 
    }).on("mouseleave", ".play .card", function() {
        $(".tooltip1").remove();
    });
    $(".game .btn-danger").hide();
    
    // A notify function that automatically fades out any notifications over 3s
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

    // A variable for storing the socket id of the opponent
    var otherSocket;

    // Code block for drawing cards in the user's hand and the opponent's hand
    socket.on('deal', function (players) {
        updatedPlayers = players;
        // Remove all opponents and user's cards
        $(".enemy .card").remove();
        $(".you .card").remove();
        // Draw all user's cards with the actual values and images
        players[socket.id].hand.forEach(function (card) {
            drawCard(card.url, "you", card.value);
        });
        // Draw goal deck
        $(".you").append("<span class='card goal ml-5' style='background-image: url(" + players[socket.id]["goal"][0].url + ");' num='" + players[socket.id]["goal"][0].value + "'></span>");
        if (players.length > 1) {
            // Checking to see i the user has the other player's socket id
            if (otherSocket) {
                // If so, draw the amount of cards they have showing the back of the cards and not the value
                for (var i = 0; i < players[otherSocket]["hand"].length; i++) {
                    drawCard("../cards/back.jpg", "enemy");
                }
            } else {
                // If not, the game has not started which means draw 5 cards for the enemy only showing the back of the cards and not the value
                for (var i = 0; i < 5; i++) {
                    drawCard("../cards/back.jpg", "enemy");
                }
            }

            for (x in players) {
                if (x !== "length" && x !== socket.id && x !== "play") {
                    // Getting the other player's socket.id
                    otherSocket = x;
                    // Draw the other player's goal deck
                    $(".enemy").append("<span class='card goal ml-5' style='background-image: url(" + players[x]["goal"][0].url + ");' num='" + players[x]["goal"][0].value + "'></span>");
                }
            }
        }
        
    });

    // Code that occurs when it is a player's turn
    socket.on("startturn", function (players) {
        updatedPlayers = players;
        // Only adds functionality if it is the user's turn
        if (players[socket.id]["turn"]) {
            var discarded;
            // End turn button click listener. When you click it, it ends the user's turn and removes all click listeners. It does not show until the user has discarded a card or run out of cards
            $(".game .btn-danger").click(function() {
                socket.emit("endturn", players);
                $(".you").off();
                $(".you-disc").off();
                $(".send").off();
                $(".game .btn-danger").off();
                $(".game .btn-danger").hide();
            });
            notify("It is now your turn!"); // Tell the user it is their turn

            // Allowing the user to select cards in their hand. Selecting a card that is already selected will unselect it. Selecting a different card that is already selected will unselect the first and select the new
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

            // Allowing the user to select cards in the discard pile. If the card is already selected it will unselect it. 
            $(".you-disc").on('click', function (e) {
                if ($(e.target).hasClass("selected")) {
                    $(e.target).removeClass("selected");
                } else {
                    if ($(e.target).hasClass("card")) {
                        // If there is another card selected already and you click on a card in the discard pile that is not the selected card, it will not do anything to allow for discarding cards and preventing bugs.
                        if (!$(".selected").length) {
                            $(e.target).addClass("selected");
                            e.stopPropagation();
                        }
                    }
                }
            });

            // .send includes the opponent's discard pile, the user's discard pile, and the play piles.
            $(".send").on('click', function (e) {
                // Only has functionality if you click on a card or pile
                if (e.target !== this) {
                    // Only has functionality if there is a selected card
                    if ($(".selected").length) {
                        // Code block for discarding cards. You cannot discard goal cards, and you cannot discard cards from the discard pile
                        if ($(".selected").length && $(e.target).hasClass("you-discard") && !$(".selected").hasClass("goal") && !$(".selected").hasClass("you-discard")) {
                            // You can only discard one card per turn
                            if(!discarded) {
                                // Draw the new card in the clicked index location
                                var index = $(e.target).index();
                                var str = "<span class='card you-discard turn-discard' style='background-image: url(" + "../cards/" + $(".selected").attr("num") + ".jpg" + ");' num='" + $(".selected").attr("num") + "'></span>"
                                $(e.target).replaceWith(str);

                                // Update the players variable to show the added discard pile and removed hand card
                                players[socket.id]["discard"][String(index)].push(players[socket.id]["hand"].splice($(".selected").index(), 1)[0]);
                                $(".selected").remove(); // Remove the selected card
                                updatedPlayers = players; // Update the non-local players variable
                                // Send the html to the server as a "change" message. The opponent will receive it on the other end and redraw their screen
                                socket.emit("change", { play: $(".play").html(), "en-disc": $(".you-disc").html(), id: socket.id, hand: true, players: players });
                                discarded =true;
                                $(".game .btn-danger").show(); // Show the button to end the user's turn
                            }
                        // Code block for playing a card into a play pile. You cannot play a card you discarded on the same turn, and the card's value must be one greater than the top card's value unless it is a "Pass"
                        } else if ((($(".selected").attr("num") === "pass" && $(e.target).attr("num")) || (Number($(".selected").attr("num")) === Number($(e.target).attr("num")) + 1)) && !$(".selected").hasClass("turn-discard")) {
                            var fullPile = false;
                            // Creating a string of the card html
                            if ($(".selected").attr("num") === "pass") {
                                var str = drawCard("../cards/pass.jpg", "", String(Number($(e.target).attr("num")) + 1), false);
                            } else {
                                var str = drawCard("../cards/" + $(".selected").attr("num") + ".jpg", "", $(".selected").attr("num"), false);
                            }
                            // Getting the index of the chosen play pile
                            var index = String($(e.target).index());
                            // If you are playing a card onto an 11, that means the playing pile will be full. Reset that playing pile and set fullpile to be used later
                            if($(e.target).attr("num") === "11") {
                                $(e.target).replaceWith('<span class="no-card" num="0"></span>');
                                fullPile = true;
                            } else {
                            // Otherwise, replace that card with the selected card
                                $(e.target).replaceWith(str);
                            }

                            // Code block for playing a card from the goal pile
                            if ($(".selected").hasClass("goal")) {
                                // Update play pile and player's goal pile to reflect changes
                                players["play"][index].push(players[socket.id]["goal"].shift());
                                // If the pile was full, send that pile to the garbage
                                if(fullPile) {
                                    socket.emit("fullPile", index)
                                    players["play"][index] = [];
                                }

                                // If the new goal length is 0, the player wins and emit "win"
                                if (players[socket.id]["goal"].length === 0) {
                                    $(".selected").replaceWith('<span class="no-card" num="0"></span>');
                                    updatedPlayers = players;
                                    socket.emit("change", { "play": $(".play").html(), "en-disc": $(".you-disc").html(), "id": socket.id, "hand": false, "players": players });
                                    socket.emit("win");
                                } else {
                                    // Otherwise, replace the card in the goal pile with the next goal card
                                    $(".selected").replaceWith("<span class='card goal ml-5' style='background-image: url(" + players[socket.id]["goal"][0].url + ");' num='" + players[socket.id]["goal"][0].value + "'></span>");
                                    updatedPlayers = players;
                                    // Emit the change so the other user is updated in real time
                                    socket.emit("change", { "play": $(".play").html(), "en-disc": $(".you-disc").html(), "id": socket.id, "hand": false, "players": players });
                                }

                            // Code block for playing from a discard pile
                            } else if ($(".selected").hasClass("you-discard")) {
                                // Update the players variable to remove the discard card and add to the play pile
                                players["play"][index].push(players[socket.id]["discard"][$(".selected").index()].pop());
                                // If the pile was full, send that pile to the garbage
                                if(fullPile) {
                                    socket.emit("fullPile", index)
                                    players["play"][index] = [];
                                }
                                updatedPlayers = players;
                                // If there are no more cards in that discard pile, replace it with an empty pile
                                if (players[socket.id]["discard"][$(".selected").index()].length === 0) {
                                    $(".selected").replaceWith("<span class='no-card you-discard'></span>");
                                } else {
                                    // Otherwise, replace it with the next card in the discard pile
                                    $(".selected").replaceWith("<span class='card you-discard' style='background-image: url(" + players[socket.id]["discard"][$(".selected").index()][players[socket.id]["discard"][$(".selected").index()].length - 1].url + ");' num='" + players[socket.id]["discard"][$(".selected").index()][players[socket.id]["discard"][$(".selected").index()].length - 1].value + "'></span>");
                                }
                                // Emit the change so the other user is updated in real time
                                socket.emit("change", { "play": $(".play").html(), "en-disc": $(".you-disc").html(), "id": socket.id, "hand": false, "players": players });

                            // Code block for playing a card from your hand
                            } else {
                                // Update the players variable to remove the hand card and add to the play pile
                                players["play"][index].push(players[socket.id]["hand"].splice($(".selected").index(), 1));
                                // If the pile was full, send that pile to the garbage
                                if(fullPile) {
                                    socket.emit("fullPile", index)
                                    players["play"][index] = [];
                                }
                                updatedPlayers = players;
                                $(".selected").remove();
                                // Emit the change so the other user is updated in real time
                                socket.emit("change", { "play": $(".play").html(), "en-disc": $(".you-disc").html(), "id": socket.id, "hand": true, "players": players });
                            }
                            // Show the end turn button if the player has no cards left in their hand
                            if(players[socket.id]["hand"].length === 0) {
                                $(".game .btn-danger").show();
                            }
                        }
                    }
                }
            });
        } else {
            // If not the user's turn, notify the user
            notify("It is now your opponent's turn!");
        }
    });
    
    // Every time a user emits "change", the server emits "state" back
    socket.on("state", function (data) {
        updatedPlayers = data.players;
        // Only has functionality if the other user sent the "change" message
        if (data.id !== socket.id) {
            // replace the html of the opponent's discard and play piles to match what it is on the other user's end
            $(".play").html(data.play);
            $(".en-disc").html(data["en-disc"]);
            // Switching the enemy's discard pile classes from .you-discard to .enemy-discard
            $(".en-disc .you-discard").each(function() {
                $(this).removeClass("you-discard");
                $(this).addClass("enemy-discard");
            });
            $(".turn-discard").removeClass("turn-discard");
            // Removing a card from the enemy player's hand if they played a card from their hand
            if (data["hand"]) {
                $(".enemy .card:first").remove();
            } else {
                // Updating their goal card otherwise
                $(".enemy .goal").replaceWith("<span class='card goal ml-5' style='background-image: url(" + data["players"][otherSocket]["goal"][0].url + ");' num='" + data["players"][otherSocket]["goal"][0].value + "'></span>");
            }
        }
    });

    // Gameover is emitted when the game is over
    socket.on("gameover", function(players) {
        // Remove all click and hover listeners. Allow users to leave without a warning.
        updatedPlayers = players;
        $(".game").find("*").off();
        $(".game").off();
        window.removeEventListener("beforeunload", listenerfunction);
        // Show win message if the user won, and lose message if the user lost.
        if(players[socket.id].win) {
            $("body").append('<div class="gameover"><h1 class="mt-5">You won!</h1><h3 class="mt-5">Good job, your mom must be proud!</h3><h3 class="mt-3">To go back to the home page, click the button below.</h3><a href="/" class="btn btn-success mt-5">Click Here to go Home</a></div>');
        } else {
            $("body").append('<div class="gameover"><h1 class="mt-5">You lost!</h1><h3 class="mt-5">Too bad, better luck next time!</h3><h3 class="mt-3">To go back to the home page, click the button below.</h3><a href="/" class="btn btn-success mt-5">Click Here to go Home</a></div>');
        }
    });
});


