const User = require("../models/user"),
      socketListener = require("./sockets");
// This is the web socket listener for every single page. It gives each user updates in real time about friends online, game invites, etc...
function mainSocketListener(io, urls) {
    // The of("/") specifies a namespace. Any file that connects to the namespace "/" (which is every one for this app) will have these socket listeners.
    var main = io.of("/");
    // The connected user sockets variable object is very useful to indicate if a user is currently connected to the server.
    var connectedUserSockets = {};
    main.on("connection", function(socket) {
        // When they connect, attach all these socket listeners

        socket.on("newsocket", function(id) {
            // Any time a new socket connects, they'll emit the "newsocket" message with their mongodb user _id if they are logged in. As of right now, things can get messy if a user is logged in at two places at once.
            if(connectedUserSockets[id]) {
                // If the user is already logged in somewhere else, it sends them the "alreadyonline" message which tells them that they are already logged in.
                return socket.emit("alreadyonline")
            }
            // Setting the socket.userId variable to be the user's mongodb user _id. 
            socket.userId = id;
            // Find the user in the db by the id
            User.findById(id, function(err, user) {
                if(err) {
                    // Not really sure how there would be an error here so just leaving it as a console.log
                    console.log(err);
                } else {
                    // Setting the socket.username to be the users username.
                    socket.username = user.username;
                    // Adding the user _id to the connectedUserSockets, which indicates that they are online. 
                    connectedUserSockets[socket.userId] = socket.id;
                    // When the user connects, it finds all of their friends. If their friend is online, it sends them a message to let them know that the user is online, and it send the user a message to let them know that that friend is online.
                    user.friends.forEach(function(friend) {
                        if(connectedUserSockets[friend.id]) {
                            socket.emit("useronline", friend.id, friend.username);
                            socket.broadcast.to(connectedUserSockets[friend.id]).emit("useronline", socket.userId, socket.username);
                        }
                    });
                }
            });
        });

        // This code block esssentially allows users to add other users to their friend-request lists. It updates the added user in real time that they have a friend request.
        socket.on("findfriend", function(findfriend) {
            // Find the friend with the given username
            User.findOne({username: findfriend}, function(err, foundfriend) {
                if(err) {
                    // After adding, they will be given either an error or success message displayed as an alert
                    var message = {danger: err.message};
                } else {
                    // There has to be a user with that username, and it cannot be the same as the user's username
                    if(foundfriend && foundfriend.username !== socket.username) {
                        // They cannot have requested to add the other user already
                        var requested = foundfriend.friendinvites.some(function(friendinvite) {
                            return friendinvite.id == socket.userId;
                        });
                        // They cannot be friends with the other user already
                        var friendlist = foundfriend.friends.some(function(friend) {
                            return friend.id == socket.userId;
                        });
                        if(!requested) {
                            if(!friendlist) {
                                // If all those tests pass, add the friend request to the found user's friend request list.
                                foundfriend.friendinvites.push({id: socket.userId, username: socket.username});
                                foundfriend.save();
                                var message = {success: "Sent a friend request to: " + foundfriend.username};
                                // Tell the other user that they have a new friend request in real time.
                                socket.broadcast.to(connectedUserSockets[foundfriend.id]).emit("newfriendrequest", socket.username, socket.userId);
                            } else {
                                var message = {danger: "You are already friends with " + foundfriend.username};
                            }
                        } else {
                            var message = {danger: "You already sent a friend request to: " + foundfriend.username};
                        }
                    } else {
                        var message = {danger: "No valid user with that username found!"};
                    } 
                }
                // Tell the user who sent tried to send a friend request whether or not it succeeded and why.
                socket.emit("findfriendresult", message)
            });
        });

        // This is the code block that handles what happens when a user accepts a pending friend request.
        socket.on("acceptrequest", function(id) {
            // Find the user that is accepting the friend request
            User.findById(socket.userId, function(err, user) {
                if(err) {
                    // Return an error message if there is an error
                    return socket.emit("acceptrequestresult", {danger: err.message});
                } else {
                    var friendId;
                    // Make sure that the user has that friend in their pending friend requests
                    if(user.friendinvites.some(function(friendinvite) {
                        friendId = {id: friendinvite.id, username: friendinvite.username};
                        return friendinvite.id == id;
                    })) {
                        // If so, remove that friend request
                        user.friendinvites = user.friendinvites.filter(function(value, index, arr) {
                            return value.id !== id
                        });
                        // Add the friend to the users list of friends.
                        user.friends.push(friendId);
                        user.save();
                        // Then find the friend
                        User.findById(id, function(err, friend) {
                            if(err) {
                                // If there is an error finding the friend, let them know
                                return socket.emit("acceptrequestresult", {danger: err.message})
                            } else {
                                // Otherwise, add the user to the friend's list of friends.
                                friend.friends.push({id: socket.userId, username: socket.username});
                                friend.save();
                                // Let the user know that they accepted the friend request successfully.
                                socket.emit("acceptrequestresult", {success: "friend added!", friend: {id: friend.id, username: friend.username}});
                                // If the friend is online when the user accepts their friend request, notify them in real time that the user accepted their friend request
                                if(connectedUserSockets[id]) {
                                    socket.broadcast.to(connectedUserSockets[id]).emit("acceptedrequest", socket.username, socket.userId);
                                    // Tell the new friend that the user is online, and tell the user that the new friend is online.
                                    socket.emit("useronline", friend.id, friend.username)
                                    socket.broadcast.to(connectedUserSockets[id]).emit("useronline", socket.userId, socket.username);
                                }
                            }
                        });
                    } else {
                        return socket.emit("acceptrequestresult", {danger: "Friend not found!"});
                    }
                }
            });
        });
        // Code block for a user declining a friend request
        socket.on("declinerequest", function(data) {
            // Find the current user
            User.findById(socket.userId, function(err, user) {
                if(err) {
                    // Error handling as usual
                    var message = {danger: err.message};
                } else {
                    // Check if the user actually has that friend request in the database
                    if(user.friendinvites.some(function(friendinvite) {
                        return friendinvite.id == id;
                    })) {
                        // If so, remove it
                        user.friendinvites = user.friendinvites.filter(function(value, index, arr) {
                            return value.id !== id;
                        });
                        user.save();
                        var message = {success: "friend request declined!"};
                    } else {
                        var message = {danger: "Friend not found!"}
                    }
                }
                // Let the user know the status
                socket.emit("declinerequestresult", message)
            });
        });

        // Code block for removing a friend
        socket.on("removefriend", function(id) {
            // Access the friend in the database
            User.findById(id, function(err, friend) {
                if(err) {
                    // Error handling
                    socket.emit("friendremoved", {danger: err.message})
                } else {
                    // Remove the current user 
                    friend.friends = friend.friends.filter(function(value, index, arr) {
                        return value.id !== socket.userId;
                    });
                    friend.save();
                    // Find the user in the database
                    User.findById(socket.userId, function(err, self) {
                        if(err) {
                            // Error handling
                            socket.emit("friendremoved", {danger: err.message})
                        } else {
                            // Remove the friend from the list of friends
                            self.friends = self.friends.filter(function(value, index, arr) {
                                return value.id !== friend.id;
                            });
                            self.save();
                            // Let the current user know that they successfully removed them
                            socket.emit("friendremoved", {success: "Friend removed!"});
                            // If the removed friend is online, update their friends list in real time by removing that friend from their friend's list
                            if(connectedUserSockets[friend.id]) {
                                socket.broadcast.to(connectedUserSockets[friend.id]).emit("deletedfriend", socket.username, socket.userId);
                            }
                        }
                    });
                }
            });
        });

        // Code block for inviting a friend to a game of cards
        socket.on("invitefriend", function(id) {
            // Make sure that the invited user is still online and notify them that they have been invited to a game.
            var url = "/game/" + id + socket.userId;
            if(connectedUserSockets[id]) {
                socket.broadcast.to(connectedUserSockets[id]).emit("invitedtogame", socket.username, socket.userId, url);
            }
        });

        // Code block for when a user accepts an invite
        socket.on("acceptedinvite", function(id, url) {
            // Make sure the user is still online
            if(connectedUserSockets[id]) {
                // The created url for the game is "/game/{the friend's mongodb _id}{the user's mongodb _id}"
                // Add a socket listener for that url
                if(!urls.includes(id + socket.userId)) {
                    urls.push(url);
                    socketListener(url, io);
                    // Redirect both users to the game url
                    socket.broadcast.to(connectedUserSockets[id]).emit("redirectgame", url);
                    socket.emit("redirectgame", url);
                    setTimeout(function() {
                        // After they have connected, remove that url from the list of urls so that others cannot join.
                        var index = urls.indexOf(url);
                        urls.splice(index, 1);
                    }, 3000);
                }
            }
        });

        // Code block for declining a game invite
        socket.on("declinedinvite", function(id, url) {
            // Delete the url
            var index = urls.indexOf(url);
            urls.splice(index, 1);
            // If the user who sent it is still online, notify them that the user has declined
            if(connectedUserSockets[id]) {
                socket.broadcast.to(connectedUserSockets[id]).emit("frienddeclined", socket.username);
            }
        });

        // Code block for when a user disconnects, whether that be changing the page or logging out etc...
        socket.on("disconnect", function() {
            // This only runs and is relevant if the user is logged in
            if(socket.userId) {
                // Find the logged in user by their id
                User.findById(socket.userId, function(err, user) {
                    if(err) {
                        // Not sure how there would be an error here
                        console.log(err);
                    } else {
                        // Tell all of their friends, if they are logged in, that the user has disconnected.
                        user.friends.forEach(function(friend) {
                            if(connectedUserSockets[friend.id]) {
                                socket.broadcast.to(connectedUserSockets[friend.id]).emit("useroffline", socket.userId, socket.username);
                            }
                        });
                    }
                });
                // Remove their id from the online users object
                delete connectedUserSockets[socket.userId]
            }
        });
    });
}

// Exporting this to be used in app.js
module.exports = mainSocketListener;