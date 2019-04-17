// OOP file for the game. The cards and deck are objects. 

// Each card has a value (1-12 or "Pass"), and a url which is the image for the card.
class Card {
    constructor(value) {
        this.value = value;
        this.url = "../cards/" + value + ".jpg";
    }
}

// The deck is an object as well.
class Deck {
    constructor() {
        // It has an array of cards and an array of the discarded cards that will be readded to the cards array when there are 0 cards left.
        this.cards = [];
        this.garbage = [];
        // The deck gets 12 of each card from 1-12 and 18 "Pass" cards for a total of 162 cards initially
        for (var i = 1; i < 13; i++) {
            for (var j = 0; j < 12; j++) {
                this.cards.push(new Card(String(i)));
            }
        }
        for (var i = 144; i < 162; i++) {
            this.cards[i] = new Card("pass");
        }
    }
    // Shuffles the array of cards so that it is in a random order
    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]]; // swap elements
        }
    };
    // Take the top "num" amount of cards from the array and return a new array with that amount of cards
    deal(num) {
        var hand = [];
        // If there are not enough cards in the cards array to deal, it takes the cards from the garbage pile, adds them to the cards array and then shuffles them.
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

    // Add garbage to the garbage pile
    addGarbage(L) {
        this.garbage = this.garbage.concat(L);
    }
}

// Exporting the classes to be used in the sockets.js file.
module.exports = Deck;
