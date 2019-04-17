var mongoose = require("mongoose");

// Each match has a winner, loser, score, date, and length that are all strings
var matchSchema = new mongoose.Schema({
    winner: String,
    loser: String,
    score: String,
    date: String,
    length: String
});

module.exports = mongoose.model("Match", matchSchema);