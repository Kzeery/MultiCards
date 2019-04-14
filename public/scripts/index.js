$(function() {
    
    function alertResult(str, status, result) {
        $(str).append('<div class="alert alert-' + status + ' mt-3" role="alert">' + result[status] + '</div>')
        $(".alert").fadeOut(4000, function() {
            $(this).remove();
        });
    }

    function notify(text) {
        var el = $('<div class="tn-box tn-box-color-1"><p class="notification-message">' + text + '</p><button class="closebutton btn btn-success">OK</button></div>')
        $(".notifications").append(el);
        setTimeout(function() {
            el.addClass("tn-box-active");
        }, 300)
    }

    var socket = io("/");
    socket.on("connect", function() {
        if($("#userid").length) {
            socket.userId = $("#userid").attr("userid");
            socket.emit("newsocket", socket.userId);
        }
    });
    socket.on("alreadyonline", function() {
        $("body").html('<div class="container mt-5"><div><h1>You are already logged in somewhere else! You can only be logged in at one location at a time.</h1></div><div><a class="btn btn-danger" href="/logout">Logout</a></div>')
    });
    socket.on("useronline", function(id, username) {
        $(".hovering").each(function() {
            if($(this).attr("friendId") == id) {
                return $(this).addClass("online");
            }
        });
        $(".friends-length").text($(".online").length);
        $(".friends").prepend($(".online").parent().parent().detach());
    });
    socket.on("useroffline", function(id, username) {
        $(".hovering").each(function() {
            if($(this).attr("friendId") == id) {
                return $(this).removeClass("online");
            }
        });
        $(".friends").prepend($(".online").parent().parent().detach());
        $(".friends-length").text($(".online").length);
    });
    socket.on("findfriendresult", function(result) {
        if(result.success) {
                alertResult(".findfriend", "success", result);
            } else {
                alertResult(".findfriend", "danger", result);
            }
    });
    socket.on("acceptrequestresult", function(result) {
        if(result.success) {
            alertResult(".friend-invites", "success", result);
            var str = '<div class="dropdown-container"><div class="dropdown-item"><a class="hovering" friendId="'+ result.friend.id + '">'+ result.friend.username + '</a><div class="hide invbutton mt-2"><a class="btn btn-success invitefriend">Invite</a></div><div class="hide buttons mt-2"><a class="btn btn-info" href="/matches/'+ result.friend.id + '">Match History</a></div><div class="hide buttons mt-2"><a class="btn btn-danger removefriend" friendId="' + result.friend.id + '">Remove Friend</a></div></div><div class="dropdown-divider"></div></div>'
            $(".friends").append(str);
        } else {
            alertResult(".friend-invites", "danger", result);
        }
    });
    socket.on("declinerequestresult", function(result) {
        if(result.success) {
            alertResult(".friend-invites", "success", result);
        } else {
            alertResult(".friend-invites", "danger", result);
        }
    });
    socket.on("acceptedrequest", function(username, id) {
        notify(username + " has accepted your friend request!");
        var str = '<div class="dropdown-container"><div class="dropdown-item"><a class="hovering" friendId="'+ id + '">'+ username + '</a><div class="hide invbutton mt-2"><a class="btn btn-success invitefriend">Invite</a></div><div class="hide buttons mt-2"><a class="btn btn-info" href="/matches/'+ id + '">Match History</a></div><div class="hide buttons mt-2"><a class="btn btn-danger removefriend" friendId="' + id + '">Remove Friend</a></div></div><div class="dropdown-divider"></div></div>'
        $(".friends").append(str);
        $("#addfriend").remove(); 
    });

    socket.on("newfriendrequest", function(username, id) {
        $(".friend-invites").append('<div class="dropdown-item invite">' + username + '<button class="btn btn-success btn-sm ml-4 friend-request" friend="' + id + '">✓</button><button class="btn btn-sm btn-danger ml-1 friend-request" friend="' + id + '">X</button></div><div class="dropdown-divider invite"></div>')
        $(".friend-invites-length").text($(".invite").length / 2);
        notify(username + " wants to be your friend!");
    });
    socket.on("friendremoved", function(result) {
        if(result.success) {
            alertResult(".container:first", "success", result);
        } else {
            alertResult(".container:first", "danger", result);
        }
    });
    socket.on("friendinvited", function(url) {
        window.location.href = url;
    });
    socket.on("invitedtogame", function(username, id, url) {
        var el = $('<div class="tn-box tn-box-color-1"><p class="notification-message">' + username + ' has invited you to a game of cards!</p><button class="btn btn-success accept mr-2 mt-1" url="' + url + '" friendId = "' + id + '">Accept</button><button class="closebutton btn btn-danger mt-1">Deny</button></div>');
        $(".notifications").append(el);
        setTimeout(function() {
            el.addClass("tn-box-active");
        }, 300);
        setTimeout(function() {
            socket.emit("declinedinvite", id);
            el.remove();
            notify("Your game invite from " + username + " has expired!");
        }, 60000);
    });
    socket.on("deletedfriend", function(username, id) {
        $(".hovering").each(function() {
            if($(this).text() == username) {
                $(this).parent().next().remove();
                $(this).parent().remove();
                return $(".friends-length").text($(".online").length);
            }
        })
    });
    socket.on("frienddeclined", function(username) {
        notify(username + " has declined your game invite.");
        delete socket.invited;
    });
    socket.on("redirectgame", function(url) {
        window.location.href = url;
    });
    $(".notifications").on('click', ".accept", function() {
        socket.emit("acceptedinvite", $(this).attr("friendId"), $(this).attr("url"));
        window.location.href = $(this).attr("url");
    });
    
    $(".notifications").on('click', ".closebutton", function() {
        if($(this).hasClass("btn-danger")) {
            socket.emit("declinedinvite", $(this).prev().attr("friendId"));
        }
        $(this).parent().remove();
        
    });
    
    $(".findfriend").submit(function(e) {
        var data = {
            findfriend: $(this).serializeArray()[0].value
        }
        socket.emit("findfriend", data.findfriend);
        e.preventDefault();
    });
    $(".friend-invites").on('click', ".btn", function(e) {
        $(this).parent().next().remove();
        $(this).parent().remove();
        $(".friend-invites-length").text($(".invite").length / 2);
        if($(this).hasClass("btn-success")) {
            socket.emit("acceptrequest", {friend: $(this).attr("friend")})
        } else {
            socket.emit("declinerequest", {friend: $(this).attr("friend")})
        }
        e.stopPropagation();
    });
    
    $(".friends").on("mouseenter", ".dropdown-item", function() {
        $(this).children(".buttons").removeClass("hide");
        if($(this).children(".online").length) {
            $(this).children(".invbutton").removeClass("hide")
        }
    }).on("mouseleave", ".dropdown-item", function() {
        $(this).children(".buttons").addClass("hide");
        if($(this).children(".online").length) {
            $(this).children(".invbutton").addClass("hide")
        }
    });

    $(".friends").on('click', ".dropdown-item .removefriend", function(e) {
        socket.emit("removefriend", $(this).attr("friendId"));
        $(this).parent().parent().next().remove();
        $(this).parent().parent().remove();
        $(".friends-length").text($(".online").length);
        e.stopPropagation();
    });
    $(".friends").on('click', ".dropdown-item .invitefriend",function() {
        if($(this).parent().prev().hasClass("online")) {
            if(!socket.invited) {
                var friendId = $(this).parent().prev().attr("friendId");
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
    $("#addfriend").on('click', function() {
        username = $(this).attr("username");
        $(this).addClass("disabled");
        $(this).text("Requested");
        $(this).off();
        socket.emit("findfriend", username);
    });
});

