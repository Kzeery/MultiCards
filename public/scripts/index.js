$(function() {
    var socket = io("/");
    socket.on("connect", function() {
        if($("#userid").length) {
            socket.userId = $("#userid").attr("userid");
            socket.emit("newsocket", socket.userId);
            $(".hovering").each(function() {
                $(this).removeClass("online");
                socket.emit("updateonline", $(this).attr("friendId"));
            });
        }
    });

    setInterval(function() {
        $(".hovering").each(function() {
            $(this).removeClass("online");
            socket.emit("updateonline", $(this).attr("friendId"));
        });
    }, 20000)
    socket.on("useronline", function(id) {
        $(".hovering").each(function() {
            if($(this).attr("friendId") == id) {
                $(this).addClass("online");
            }
        });
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
            $(".friends").append('<div class="dropdown-item">' + result.friend + '</div><div class="dropdown-divider"></div>'); // not gonna work
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
        console.log(username + " accepted your friend request");
        $(".friends").append('<a class="dropdown-item" href="/matches/' + id +'">' + username + '</a><div class="dropdown-divider"></div>')  // not gonna work
        $("#friends-length").text(Number($("#friends-length").text()) + 1);
    });

    socket.on("newfriendrequest", function(username, id) {
        $(".friend-invites").append('<div class="dropdown-item invite">' + username + '<button class="btn btn-success btn-sm ml-4 friend-request" friend="' + id + '">✓</button><button class="btn btn-sm btn-danger ml-1 friend-request" friend="' + id + '">X</button></div><div class="dropdown-divider invite"></div>')
        $(".friend-invites-length").text($(".invite").length / 2);
    });
    socket.on("friendremoved", function(result) {
        if(result.success) {
            alertResult(".container:first", "success", result);
        } else {
            alertResult(".container:first", "danger", result);
        }
    });
    socket.on("deletedfriend", function(username, id) {
        console.log(username + " with id of " + id + " has deleted you!")
        $(".hovering").each(function() {
            if($(this).text() == username) {
                $(this).parent().next().remove();
                $(this).parent().remove();
                $("#friends-length").text(Number($("#friends-length").text()) - 1);

            }
        })
    })
    
    function alertResult(str, status, result) {
        $(str).append('<div class="alert alert-' + status + ' mt-3" role="alert">' + result[status] + '</div>')
        $(".alert").fadeOut(4000, function() {
            $(this).remove();
        });
    }

    $(".findfriend").submit(function(e) {
        var data = {
            findfriend: $(this).serializeArray()[0].value
        }
        socket.emit("findfriend", data.findfriend);
        e.preventDefault();
    });
    $(".friend-invites").click(function(e) {
        if($(e.target).hasClass("btn")) {
            $(e.target).parent().next().remove();
            $(e.target).parent().remove();
            $(".friend-invites-length").text($(".invite").length / 2);
            if($(e.target).hasClass("btn-success")) {
                socket.emit("acceptrequest", {friend: $(e.target).attr("friend")})
            } else {
                socket.emit("declinerequest", {friend: $(e.target).attr("friend")})
            }
        }
       e.stopPropagation();
    });
    
    $(".friends .dropdown-item").on("mouseenter", function() {
        $(this).children(".buttons").removeClass("hide");
    }).on("mouseleave", function() {
        $(this).children(".buttons").addClass("hide");
    });

    $(".removefriend").on('click', function(e) {
        socket.emit("removefriend", $(this).attr("friendId"));
        $(this).parent().parent().next().remove();
        $(this).parent().parent().remove();
        $("#friends-length").text(Number($("#friends-length").text()) - 1);
        e.stopPropagation();
    });
    $(".invitefriend").on('click', function() {
        if($(this).prev().hasClass("online")) {
            socket.emit("invitegame", $(this).prev().attr("friendId"));
        }
    })
});