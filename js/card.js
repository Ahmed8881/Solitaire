class Card {
    constructor(rank, suit) {
        this.rank = rank;
        this.suit = suit;
        this.color = (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black';
        this.faceUp = false;
    }
}
export default Card;