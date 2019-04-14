var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

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

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);