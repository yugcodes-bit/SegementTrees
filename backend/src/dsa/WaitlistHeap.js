/**
 * Smart Seat: Priority Waitlist (Min-Heap)
 * Manages sold-out event waitlists based on VIP Tier and Timestamp.
 */
class WaitlistNode {
    constructor(user, tier) {
        this.user = user;       // e.g., "John Doe" or a User ID
        this.tier = tier;       // 1 = VIP, 2 = General
        this.timestamp = Date.now(); // Exact millisecond they joined
    }
}

class WaitlistHeap {
    constructor() {
        this.heap = [];
    }

    getLeftChildIndex(parentIndex) { return 2 * parentIndex + 1; }
    getRightChildIndex(parentIndex) { return 2 * parentIndex + 2; }
    getParentIndex(childIndex) { return Math.floor((childIndex - 1) / 2); }

    hasLeftChild(index) { return this.getLeftChildIndex(index) < this.heap.length; }
    hasRightChild(index) { return this.getRightChildIndex(index) < this.heap.length; }
    hasParent(index) { return this.getParentIndex(index) >= 0; }

    leftChild(index) { return this.heap[this.getLeftChildIndex(index)]; }
    rightChild(index) { return this.heap[this.getRightChildIndex(index)]; }
    parent(index) { return this.heap[this.getParentIndex(index)]; }

    swap(indexOne, indexTwo) {
        const temp = this.heap[indexOne];
        this.heap[indexOne] = this.heap[indexTwo];
        this.heap[indexTwo] = temp;
    }

    isHigherPriority(indexA, indexB) {
        const nodeA = this.heap[indexA];
        const nodeB = this.heap[indexB];

        if (nodeA.tier !== nodeB.tier) {
            return nodeA.tier < nodeB.tier;
        }
        return nodeA.timestamp < nodeB.timestamp;
    }

    peek() {
        if (this.heap.length === 0) return null;
        return this.heap[0];
    }

    enqueue(user, tier) {
        const newNode = new WaitlistNode(user, tier);
        this.heap.push(newNode);
        this.heapifyUp();
    }

    dequeue() {
        if (this.heap.length === 0) return null;
        if (this.heap.length === 1) return this.heap.pop();

        const item = this.heap[0];
        this.heap[0] = this.heap.pop();
        this.heapifyDown();
        return item;
    }

    heapifyUp() {
        let index = this.heap.length - 1;
        while (this.hasParent(index) && this.isHigherPriority(index, this.getParentIndex(index))) {
            this.swap(this.getParentIndex(index), index);
            index = this.getParentIndex(index);
        }
    }

    heapifyDown() {
        let index = 0;
        while (this.hasLeftChild(index)) {
            let smallerChildIndex = this.getLeftChildIndex(index);
            if (this.hasRightChild(index) && this.isHigherPriority(this.getRightChildIndex(index), smallerChildIndex)) {
                smallerChildIndex = this.getRightChildIndex(index);
            }

            if (this.isHigherPriority(index, smallerChildIndex)) {
                break;
            } else {
                this.swap(index, smallerChildIndex);
            }
            index = smallerChildIndex;
        }
    }

    isEmpty() {
        return this.heap.length === 0;
    }
}

module.exports = WaitlistHeap;