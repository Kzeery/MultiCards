const sockets       = require("./exports/sockets"),
    session         = require("express-session"),
    LocalStrategy   = require("passport-local"),
    flash           = require("connect-flash"),
    User            = require("./models/user"),
    bodyParser      = require("body-parser"),
    socketIO        = require("socket.io"),
    mongoose        = require("mongoose"),
    passport        = require("passport"), 
    express         = require("express"),
    http            = require("http"),
    app             = express();
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.connect("mongodb://localhost/multicards");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(flash());
app.use(session({
    secret: "multicardSecret13245",
    resave: false,
    saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});
const server  = http.Server(app),
      io      = socketIO(server),
      urls    = sockets.makeurls(100);  

var main = io.of("/");
var connectedUserSockets = {};
main.on("connection", function(socket) {
    socket.on("newsocket", function(id) {
        socket.userId = id;
        User.findById(id, function(err, user) {
            if(err) {
                console.log(err);
            } else {
                socket.username = user.username;
                connectedUserSockets[socket.userId] = socket.id;
            }
        });
    });
    socket.on("findfriend", function(findfriend) {
        User.findOne({username: findfriend}, function(err, foundfriend) {
            if(err) {
                var message = {danger: err.message};
            } else {
                if(foundfriend && foundfriend.username !== socket.username) {
                    var requested = foundfriend.friendinvites.some(function(friendinvite) {
                        return friendinvite == socket.userId;
                    });
                    var friendlist = foundfriend.friends.some(function(friend) {
                        return friend.id == socket.userId;
                    });
                    if(!requested) {
                        if(!friendlist) {
                            foundfriend.friendinvites.push({id: socket.userId, username: socket.username});
                            foundfriend.save();
                            var message = {success: "Sent a friend request to: " + foundfriend.username};
                            socket.broadcast.to(connectedUserSockets[foundfriend.id]).emit("newfriendrequest", socket.username, socket.userId);

                        } else {
                            var message = {danger: "you are already friends with " + foundfriend.username};
                        }
                    } else {
                        var message = {danger: "you already sent a friend request to: " + foundfriend.username};
                    }
                } else {
                    var message = {danger: "no friend with that name found!"};
                } 
            }
            socket.emit("findfriendresult", message)
        });
    });
    socket.on("acceptrequest", function(data) {
        User.findById(socket.userId, function(err, user) {
            if(err) {
                return socket.emit("acceptrequestresult", {danger: err.message});
            } else {
                var friendId;
                if(user.friendinvites.some(function(friendinvite) {
                    friendId = {id: friendinvite.id, username: friendinvite.username};
                    return friendinvite.id == data.friend;
                })) {
                    user.friendinvites = user.friendinvites.filter(function(value, index, arr) {
                        return value.id !== data.friend
                    });
                    user.friends.push(friendId);
                    user.save();
                    User.findById(data.friend, function(err, friend) {
                        if(err) {
                            return socket.emit("acceptrequestresult", {danger: err.message})
                        } else {
                            friend.friends.push({id: socket.userId, username: socket.username});
                            friend.save();
                            socket.emit("acceptrequestresult", {success: "friend added!", friend: friend.username});
                            if(connectedUserSockets[data.friend]) {
                                socket.broadcast.to(connectedUserSockets[data.friend]).emit("acceptedrequest", socket.username, socket.userId);
                            }
                        }
                    });
                } else {
                    return socket.emit("acceptrequestresult", {danger: "Friend not found!"});
                }
            }
        });
    });
    socket.on("declinerequest", function(data) {
        User.findById(socket.userId, function(err, user) {
            if(err) {
                var message = {danger: err.message};
            } else {
                if(user.friendinvites.some(function(friendinvite) {
                    return friendinvite.id == data.friend;
                })) {
                    user.friendinvites = user.friendinvites.filter(function(value, index, arr) {
                        return value.id !== data.friend;
                    });
                    user.save();
                    var message = {success: "friend request declined!"};
                } else {
                    var message = {danger: "Friend not found!"}
                }
            }
            socket.emit("declinerequestresult", message)
        });
    });
    socket.on("removefriend", function(id) {
        User.findById(id, function(err, friend) {
            if(err) {
                socket.emit("friendremoved", {danger: err.message})
            } else {
                friend.friends = friend.friends.filter(function(value, index, arr) {
                    return value.id !== socket.userId;
                });
                friend.save();
                User.findById(socket.userId, function(err, self) {
                    if(err) {
                        socket.emit("friendremoved", {danger: err.message})
                    } else {
                        self.friends = self.friends.filter(function(value, index, arr) {
                            return value.id !== friend.id;
                        });
                        self.save();
                        socket.emit("friendremoved", {success: "Friend removed!"});
                        if(connectedUserSockets[friend.id]) {
                            socket.broadcast.to(connectedUserSockets[friend.id]).emit("deletedfriend", socket.username, socket.userId);
                        }
                    }
                });
            }
        });
    });
    socket.on("updateonline", function(id) {
        if(connectedUserSockets[id]) {
            socket.emit("useronline", id)
        }
    });
    socket.on("invitefriend", function(id) {
        if(connectedUserSockets[id]) {
            socket.broadcast.to(connectedUserSockets[id]).emit("invitedtogame", socket.username, socket.userId);
        }
    });
    socket.on("disconnect", function() {
        if(socket.userId) {
            delete connectedUserSockets[socket.userId]
        }
    });
});

app.get("/", function (req, res) {
    res.render("index");
});
app.get("/register", function(req, res) {
    res.render("register");
});

app.post("/register", function(req, res) {
    var newUser = new User({username: req.body.username})
    User.register(newUser, req.body.password, function(err, user) {
        if(err) {
            req.flash("error", err.message);
            console.log(err);
            return res.redirect("/");
        }
        passport.authenticate("local")(req, res, function() {
            req.flash("success", "Welcome to multicards " + user.username);
            res.redirect("/");
        });
    });
});
app.get("/login", function(req, res) {
    res.render("login");
});

app.post("/login", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
}),function(req, res) {
});

app.get("/logout", function(req, res) {
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/");
});

app.get("/matches/:id", function(req, res) {
    res.render("matches");
})




server.listen(3000, "127.0.0.1", function () {
    console.log("server has started!");
});
for(let x = 0; x < urls.length; x++) {
    sockets.socketListener("/game/" + urls[x], io);
}
app.get("/game/:id", function(req, res) {
    if(urls.includes(req.params.id)) {
        return res.render("game");
    }
    res.send("bad url!");
    
});