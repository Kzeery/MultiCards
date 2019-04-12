var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var matchSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    loser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    Score: String
});

matchSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("Match", matchSchema);