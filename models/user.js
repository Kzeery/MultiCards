var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

// Each user has a username, password, an array of friend-invites and friends which contains the user's mongo _id and the user's username.
// They also have an array of matches which only initially hold the match's mongo _id and contain the rest of the information when populated
// Lastly, they have a number of wins and losses which default to 0
var userSchema = new mongoose.Schema({
    username: String,
    password: String,
    friends: [{
        id: String,
        username: String
    }],
    friendinvites: [{
        id: String,
        username: String
    }],
    matches: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Match'
    }],
    losses: {type: Number, default: 0},
    wins: {type: Number, default: 0}
});

// Using passport with this user model for authentication
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);