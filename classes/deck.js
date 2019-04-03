class Card {
    constructor(value) {
        this.value = value;
        this.url = "../cards/" + value + ".jpg";
    }
}

class Deck {
    constructor() {
        this.cards = [];
        this.garbage = [];
        for (var i = 1; i < 13; i++) {
            for (var j = 0; j < 12; j++) {
                this.cards.push(new Card(String(i)));
            }
        }
        for (var i = 144; i < 162; i++) {
            this.cards[i] = new Card("pass");
        }
        this.shuffle = function () {
            for (let i = this.cards.length - 1; i > 0; i--) {
                let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
                [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]]; // swap elements
            }
        };
        this.deal = function (num) {
            var hand = [];
            for (var i = 0; i < num; i++) {
                if(!this.cards.length) {
                    this.cards = this.garbage;
                    this.garbage = [];
                    deck.shuffle();
                }
                hand.push(this.cards.shift());
            }
            return hand;
        }
        this.addGarbage = function(L) {
            this.garbage = this.garbage.concat(L);
        }
    }
}

exp = {Card, Deck}
module.exports = exp;
