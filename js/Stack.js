class Stack {
    constructor() {
        this.items = [];
    }

    push(element) {
        this.items.push(element);
    }

    pop() {
        if (this.isEmpty()) {
            return null;
        }
        return this.items.pop();
    }

    clone() {
        const newStack = new Stack();
        this.items.forEach(item => newStack.push(Object.assign({}, item)));
        return newStack;
    }

    isEmpty() {
        return this.items.length === 0;
    }

    updateStockUI() {
        const stockPile = document.getElementById("stockPile");
        stockPile.innerHTML = "";
        this.items.forEach(element => {
            stockPile.innerHTML += `
            <img src="Images/CardBg.jpg" alt="">`;
        });
    }

    peek() {
        if (this.isEmpty()) {
            return null;
        }
        return this.items[this.items.length - 1];
    }

    reset() {
        this.items = [];
    }
}

export default Stack;