$(function() {
    // Appends an alert that fades after 4s to an element of choice.
    function alertResult(str, status, result) {
        $(str).append('<div class="alert alert-' + status + ' mt-3" role="alert">' + result[status] + '</div>')
        $(".alert").fadeOut(4000, function() {
            $(this).remove();
        });
    }
    // Notifies a user in the bottom right corner with text and a close button.
    function notify(text) {
        var el = $('<div class="tn-box tn-box-color-1"><p class="notification-message">' + text + '</p><button class="closebutton btn btn-success">OK</button></div>')
        $(".notifications").append(el);
        setTimeout(function() {
            el.addClass("tn-box-active");
        }, 300)
    }

    // Connecting to the main page socket listener
    var socket = io("/");
    // If the user is logged in, tell the server the mongo _id and emit "newsocket"
    socket.on("connect", function() {
        if($("#userid").length) {
            socket.userId = $("#userid").attr("userid");
            socket.emit("newsocket", socket.userId);
        }
    });

    // If the user is already online, replace the entire page with an error message. Remove all their listeners.
    socket.on("alreadyonline", function() {
        $("body").html('<div class="container mt-5"><div><h1>You are already logged in somewhere else! You can only be logged in at one location at a time.</h1></div><div><a class="btn btn-danger" href="/logout">Logout</a></div>');
        socket.removeAllListeners();
    });

    // "useronline" is sent whenever a user's friend is online
    socket.on("useronline", function(id, username) {
        // Find the friend in the list of friends and give them the class "online" which makes the text green
        $(".hovering").each(function() {
            if($(this).attr("friendId") == id) {
                return $(this).addClass("online");
            }
        });
        // Update the friends online number
        $(".friends-length").text($(".online").length);
        // Friends online appear at the top of the friends list
        $(".friends").prepend($(".online").parent().parent().detach());
    });

    // "useronline" is sent whenever a user's friend goes offline
    socket.on("useroffline", function(id, username) {
        // Find the friend in the list of friends and remove the class "online" which makes the text back to black
        $(".hovering").each(function() {
            if($(this).attr("friendId") == id) {
                return $(this).removeClass("online");
            }
        });
        // Friends online appear at the top of the friends list
        $(".friends").prepend($(".online").parent().parent().detach());
        // Update the friends online number
        $(".friends-length").text($(".online").length);
    });

    // Alerting the user the result of trying to add a friend
    socket.on("findfriendresult", function(result) {
        if(result.success) {
                alertResult(".findfriend", "success", result);
            } else {
                alertResult(".findfriend", "danger", result);
            }
    });

    // Alerting the user the result of trying to accept a friend request
    socket.on("acceptrequestresult", function(result) {
        if(result.success) {
            // Add the new friend to the list of friends
            alertResult(".friend-invites", "success", result);
            var str = '<div class="dropdown-container"><div class="dropdown-item"><a class="hovering" friendId="'+ result.friend.id + '">'+ result.friend.username + '</a><div class="hide invbutton mt-2"><a class="btn btn-success invitefriend">Invite</a></div><div class="hide buttons mt-2"><a class="btn btn-info" href="/matches/'+ result.friend.id + '">Match History</a></div><div class="hide buttons mt-2"><a class="btn btn-danger removefriend" friendId="' + result.friend.id + '">Remove Friend</a></div></div><div class="dropdown-divider"></div></div>'
            $(".friends").append(str);
        } else {
            alertResult(".friend-invites", "danger", result);
        }
    });

    // Alert the user the result of trying to decline a friend request
    socket.on("declinerequestresult", function(result) {
        if(result.success) {
            alertResult(".friend-invites", "success", result);
        } else {
            alertResult(".friend-invites", "danger", result);
        }
    });

    // Notify a user in real time that someone has accepted a friend request.
    socket.on("acceptedrequest", function(username, id) {
        notify(username + " has accepted your friend request!");
        var str = '<div class="dropdown-container"><div class="dropdown-item"><a class="hovering" friendId="'+ id + '">'+ username + '</a><div class="hide invbutton mt-2"><a class="btn btn-success invitefriend">Invite</a></div><div class="hide buttons mt-2"><a class="btn btn-info" href="/matches/'+ id + '">Match History</a></div><div class="hide buttons mt-2"><a class="btn btn-danger removefriend" friendId="' + id + '">Remove Friend</a></div></div><div class="dropdown-divider"></div></div>'
        // Add thew new friends to their list of friends
        $(".friends").append(str);
        $("#addfriend").remove(); 
    });

    // Notify the user that they have a new friend request, and add that friend request to their pending friend requests dropdown.
    socket.on("newfriendrequest", function(username, id) {
        $(".friend-invites").append('<div class="dropdown-item invite">' + username + '<button class="btn btn-success btn-sm ml-4 friend-request" friend="' + id + '">✓</button><button class="btn btn-sm btn-danger ml-1 friend-request" friend="' + id + '">X</button></div><div class="dropdown-divider invite"></div>')
        $(".friend-invites-length").text($(".invite").length / 2);
        notify(username + " wants to be your friend!");
    });

    // Notify the user the result of trying to remove a friend
    socket.on("friendremoved", function(result) {
        if(result.success) {
            alertResult(".container:first", "success", result);
        } else {
            alertResult(".container:first", "danger", result);
        }
    });

    // Notify the user that they have been invited to a game with buttons that give a response
    socket.on("invitedtogame", function(username, id, url) {
        var el = $('<div class="tn-box tn-box-color-1"><p class="notification-message">' + username + ' has invited you to a game of cards!</p><button class="btn btn-success accept mr-2 mt-1" url="' + url + '" friendId = "' + id + '">Accept</button><button class="closebutton btn btn-danger mt-1">Deny</button></div>');
        $(".notifications").append(el);
        setTimeout(function() {
            el.addClass("tn-box-active");
        }, 300);
        // A game invite expires after 60s
        setTimeout(function() {
            socket.emit("declinedinvite", id);
            el.remove();
            notify("Your game invite from " + username + " has expired!");
        }, 60000);
    });

    // If a friend has deleted the user, "deletedfriend" is emitted. The friend is removed and the amount of friends online is updated.
    socket.on("deletedfriend", function(username, id) {
        $(".hovering").each(function() {
            if($(this).text() == username) {
                $(this).parent().next().remove();
                $(this).parent().remove();
                return $(".friends-length").text($(".online").length);
            }
        })
    });

    // If a user declines a game invite, notify the user who sent it. Allow them then to send another invite to someone else.
    socket.on("frienddeclined", function(username) {
        notify(username + " has declined your game invite.");
        delete socket.invited;
    });

    // Redirecting users to the game page.
    socket.on("redirectgame", function(url) {
        window.location.href = url;
    });

    // When you click the accept button for a game invite, tell the server you did with the url and the friend's mongoDB _id
    $(".notifications").on('click', ".accept", function() {
        socket.emit("acceptedinvite", $(this).attr("friendId"), $(this).attr("url"));
    });
    
    // If the user declines a game invite, remove the notification and emit the "declinedinvite" message
    $(".notifications").on('click', ".closebutton", function() {
        if($(this).hasClass("btn-danger")) {
            socket.emit("declinedinvite", $(this).prev().attr("friendId"), $(this).prev().attr("url"));
        }
        $(this).parent().remove();
    });
    
    // Sending the form to add a friend
    $(".findfriend").submit(function(e) {
        var data = {
            findfriend: $(this).serializeArray()[0].value
        }
        // Stop the redirect and emit the "findfriend" message
        socket.emit("findfriend", data.findfriend);
        e.preventDefault();
    });

    // When you click either decline or accept on a pending friend request
    $(".friend-invites").on('click', ".btn", function(e) {
        // Remove the friend request
        $(this).parent().next().remove();
        $(this).parent().remove();
        // Update the length of friend requests
        $(".friend-invites-length").text($(".invite").length / 2);
        if($(this).hasClass("btn-success")) {
            // If you click yes, send "acceptrequest" message
            socket.emit("acceptrequest", $(this).attr("friendId"));
        } else {
            // Otherwise emit "declinerequest" message
            socket.emit("declinerequest",  $(this).attr("friendId"));
        }
        e.stopPropagation();
    });
    
    // Allowing the user to mouseover their friends to see buttons
    $(".friends").on("mouseenter", ".dropdown-item", function() {
        $(this).children(".buttons").removeClass("hide");
        // If the user is online, then you can see the "invite" button
        if($(this).children(".online").length) {
            $(this).children(".invbutton").removeClass("hide")
        }
    }).on("mouseleave", ".dropdown-item", function() {
        // Hide all the buttons when the mouseleaves
        $(this).children(".buttons").addClass("hide");
        if($(this).children(".online").length) {
            $(this).children(".invbutton").addClass("hide")
        }
    });

    // Removing a friend
    $(".friends").on('click', ".dropdown-item .removefriend", function(e) {
        // Remove the friend from client side and send "removefriend" message to server
        socket.emit("removefriend", $(this).attr("friendId"));
        $(this).parent().parent().next().remove();
        $(this).parent().parent().remove();
        $(".friends-length").text($(".online").length);
        e.stopPropagation();
    });

    // Inviting a friend to a game
    $(".friends").on('click', ".dropdown-item .invitefriend",function() {
        // They must be online and the user cannot spam invites
        if($(this).parent().prev().hasClass("online")) {
            if(!socket.invited) {
                // Notify the user that they have invited someone
                var friendId = $(this).parent().prev().attr("friendId");
                // Emit "invitefriend" message
                notify("Invited " + $(this).parent().prev().text() + " to a game of cards! Waiting on their response.");
                socket.emit("invitefriend", friendId);
                socket.invited = true;
            } else{
                notify("You have already invited someone to a game. Please wait for a response before inviting someone else!");
            }
        } else {
            notify("This user is not online right now.");
        }
    });

    // There is an addfriend button on the match history page if you reach sombody's match history without being their friend
    $("#addfriend").on('click', function() {
        // Emit the "findfriend" message and remove the functionality of the button
        username = $(this).attr("username");
        $(this).addClass("disabled");
        $(this).text("Requested");
        $(this).off();
        socket.emit("findfriend", username);
    });
});

