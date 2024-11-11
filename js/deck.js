import Card from './card.js';
class Deck{
    constructor(){
        this.cards=[]
        this.InitializeDeck()
      
    }
    InitializeDeck(){
        const suits=['Spades','Diamonds','Clubs','Hearts']
        const ranks=['ACE','2','3','4','5','6','7','8','9','10','King','Queen','Jack']
        suits.forEach(suit => {
            ranks.forEach(rank=>{
                var color='';
                if(suit=='Diamonds'|| suit=='Hearts'){
                    color='red';
                }
                else{
                    color='black';
                }
                const card=new Card(rank,suit,color);
                this.cards.push(card);
            });
        });
    }
  
    shuffleEasy() {
        const ranks = ["ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king"];
        
        this.cards.sort((a, b) => {
          const rankA = ranks.indexOf(a.rank.toLowerCase());
          const rankB = ranks.indexOf(b.rank.toLowerCase());
      
          if (a.suit === b.suit) {
            return rankA - rankB;
          }
          return a.suit.localeCompare(b.suit);
        });
      
       
      }
    shuffleMedium() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }
    shuffleHard() {
        const spadesAndClubs = this.cards.filter(card => card.suit === 'Spades' || card.suit === 'Clubs');
        const diamondsAndHearts = this.cards.filter(card => card.suit === 'Diamonds' || card.suit === 'Hearts');
    
        // Shuffle the Spades and Clubs group three times
        for (let k = 0; k < 3; k++) {
            for (let i = spadesAndClubs.length - 1; i > 0; i--) {
                let j = Math.floor(Math.random() * (i + 1));
                [spadesAndClubs[i], spadesAndClubs[j]] = [spadesAndClubs[j], spadesAndClubs[i]];
            }
        }
    
        // Ensure ACE is not the first card in the Spades and Clubs group
        for (let i = 0; i < spadesAndClubs.length; i++) {
            if (spadesAndClubs[i].rank === 'ACE') {
                let j = Math.floor(Math.random() * (spadesAndClubs.length - 1)) + 1;
                [spadesAndClubs[i], spadesAndClubs[j]] = [spadesAndClubs[j], spadesAndClubs[i]];
            }
        } 
    
        // Combine the shuffled Spades and Clubs with the Diamonds and Hearts
        this.cards = [...spadesAndClubs, ...diamondsAndHearts];
    }
 
    
    deal(numberOfCards) {
        if (numberOfCards > this.cards.length) {
            throw new Error("Not enough cards in the deck to deal.");
        }
        return this.cards.splice(-numberOfCards); 
    }

}
export default Deck;
