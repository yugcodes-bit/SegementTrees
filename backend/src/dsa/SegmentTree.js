/**
 * EventHorizon: Contiguous Segment Tree
 * Tracks the maximum contiguous empty seats in a row.
 */
class SegmentTree {
    constructor(size) {
        this.size = size;
        // Tree arrays: we need 4 * size to be safe
        this.treeMax = new Array(4 * size).fill(0);   // Max contiguous empty seats in this segment
        this.treeLeft = new Array(4 * size).fill(0);  // Max contiguous empty seats starting from the left
        this.treeRight = new Array(4 * size).fill(0); // Max contiguous empty seats ending at the right
        this.lazy = new Array(4 * size).fill(-1);     // Lazy propagation array (-1: no pending update, 0: book, 1: unbook)

        // Initialize the tree assuming all seats are empty (value 1)
        this.build(1, 0, size - 1);
    }

    // Combine left and right child data to update the parent
    pushUp(node, left, right) {
        const mid = Math.floor((left + right) / 2);
        const leftChild = 2 * node;
        const rightChild = 2 * node + 1;
        const leftLength = mid - left + 1;
        const rightLength = right - mid;

        // Calculate left prefix
        this.treeLeft[node] = this.treeLeft[leftChild];
        if (this.treeLeft[leftChild] === leftLength) {
            this.treeLeft[node] += this.treeLeft[rightChild];
        }

        // Calculate right suffix
        this.treeRight[node] = this.treeRight[rightChild];
        if (this.treeRight[rightChild] === rightLength) {
            this.treeRight[node] += this.treeRight[leftChild];
        }

        // Calculate overall max contiguous empty space
        this.treeMax[node] = Math.max(
            this.treeMax[leftChild],
            this.treeMax[rightChild],
            this.treeRight[leftChild] + this.treeLeft[rightChild]
        );
    }

    // Push pending lazy updates down to children
    pushDown(node, left, right) {
        if (this.lazy[node] !== -1) {
            const mid = Math.floor((left + right) / 2);
            const leftChild = 2 * node;
            const rightChild = 2 * node + 1;
            const leftLength = mid - left + 1;
            const rightLength = right - mid;
            const val = this.lazy[node];

            // Update left child
            this.lazy[leftChild] = val;
            this.treeMax[leftChild] = val ? leftLength : 0;
            this.treeLeft[leftChild] = val ? leftLength : 0;
            this.treeRight[leftChild] = val ? leftLength : 0;

            // Update right child
            this.lazy[rightChild] = val;
            this.treeMax[rightChild] = val ? rightLength : 0;
            this.treeLeft[rightChild] = val ? rightLength : 0;
            this.treeRight[rightChild] = val ? rightLength : 0;

            // Clear current node's lazy flag
            this.lazy[node] = -1;
        }
    }

    // Build the initial tree
    build(node, left, right) {
        if (left === right) {
            this.treeMax[node] = 1;
            this.treeLeft[node] = 1;
            this.treeRight[node] = 1;
            return;
        }
        const mid = Math.floor((left + right) / 2);
        this.build(2 * node, left, mid);
        this.build(2 * node + 1, mid + 1, right);
        this.pushUp(node, left, right);
    }

    // Update a range of seats (val = 0 for booking, val = 1 for cancelling)
    update(node, left, right, queryLeft, queryRight, val) {
        if (queryLeft <= left && right <= queryRight) {
            this.treeMax[node] = val ? (right - left + 1) : 0;
            this.treeLeft[node] = val ? (right - left + 1) : 0;
            this.treeRight[node] = val ? (right - left + 1) : 0;
            this.lazy[node] = val;
            return;
        }

        this.pushDown(node, left, right);
        const mid = Math.floor((left + right) / 2);

        if (queryLeft <= mid) {
            this.update(2 * node, left, mid, queryLeft, queryRight, val);
        }
        if (queryRight > mid) {
            this.update(2 * node + 1, mid + 1, right, queryLeft, queryRight, val);
        }

        this.pushUp(node, left, right);
    }

    // Find the starting index of a block of 'k' contiguous empty seats
    query(node, left, right, k) {
        if (left === right) return left; // Found the start index

        this.pushDown(node, left, right);
        const mid = Math.floor((left + right) / 2);
        const leftChild = 2 * node;
        const rightChild = 2 * node + 1;

        // Rule 1: Check if the left child has enough space entirely inside it
        if (this.treeMax[leftChild] >= k) {
            return this.query(leftChild, left, mid, k);
        }
        // Rule 2: Check if space exists across the boundary of left and right children
        if (this.treeRight[leftChild] + this.treeLeft[rightChild] >= k) {
            return mid - this.treeRight[leftChild] + 1;
        }
        // Rule 3: Check if the right child has enough space entirely inside it
        if (this.treeMax[rightChild] >= k) {
            return this.query(rightChild, mid + 1, right, k);
        }

        return -1; // No block of k contiguous seats found
    }

    // Public API: Book 'k' contiguous seats
    bookContiguous(k) {
        if (this.treeMax[1] < k) return null; // Not enough contiguous space

        const startIndex = this.query(1, 0, this.size - 1, k);
        const endIndex = startIndex + k - 1;
        
        // Mark seats as booked (0)
        this.update(1, 0, this.size - 1, startIndex, endIndex, 0);
        
        return { start: startIndex, end: endIndex };
    }
}

module.exports = SegmentTree;