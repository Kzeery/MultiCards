// This function is just for converting time values from miliseconds since 1970 to hours : minutes : seconds for the match history page. It is used in the sockets.js file.
function convertToTime(t1, t2) {
    var elapsed = t2 - t1
    var hours = Math.floor(elapsed / 3600000);
    elapsed = elapsed % 3600000;
    var minutes = Math.floor(elapsed / 60000);
    if(minutes < 10) {
        minutes = "0" + String(minutes);
    }
    elapsed = elapsed % 60000;
    var seconds = Math.round(elapsed / 1000);
    if(seconds < 10) {
        seconds = "0" + String(seconds);
    }
    return hours + ":" + minutes + ":" + seconds
}

module.exports = convertToTime;