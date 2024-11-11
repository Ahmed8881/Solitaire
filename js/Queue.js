class Queue {
    constructor() {
        this.items = [];
    }
    

    enqueue(item) {
        this.items[this.items.length] = item;
    }
    dequeue() {
        if (this.isEmpty()) {
            return;
        }
        const item = this.items[0];
        this.items = this.items.slice(1);
        return item;
    }

    reset() {
        this.items = [];
    }
    clone() {
        const newQueue = new Queue();
        this.items.forEach(item => newQueue.enqueue(Object.assign({}, item)));
        return newQueue;
      }

    isEmpty() {
        return this.items.length === 0;
    }

    peek() {
        if (!this.isEmpty()) {
            return this.items[0];
        }
    }

    size() {
        return this.items.length;
    }

 
}

export default Queue;