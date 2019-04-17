function calcEasternTime() {
    d = new Date();
    utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    nd = new Date(utc + (3600000*-4));
    return nd
}

module.exports = calcEasternTime;