var mongoose = require("mongoose");

var matchSchema = new mongoose.Schema({
    winner: String,
    loser: String,
    score: String,
    date: String,
    length: String
});

module.exports = mongoose.model("Match", matchSchema);