/**
 * Smart Seat: Trie Search (Prefix Tree)
 * Used for instant event auto-complete.
 */
class TrieNode {
    constructor() {
        this.children = {};
        this.isEndOfWord = false;
        this.eventData = null; // Stores basic event info at the leaf
    }
}

class TrieSearch {
    constructor() {
        this.root = new TrieNode();
    }

    // Insert an event name into the Trie
    insert(word, eventData) {
        let current = this.root;
        const lowerWord = word.toLowerCase();
        for (let i = 0; i < lowerWord.length; i++) {
            let char = lowerWord[i];
            if (!current.children[char]) {
                current.children[char] = new TrieNode();
            }
            current = current.children[char];
        }
        current.isEndOfWord = true;
        current.eventData = eventData;
    }

    // Find all words that start with a given prefix
    getSuggestions(prefix) {
        let current = this.root;
        const lowerPrefix = prefix.toLowerCase();
        
        // Navigate to the end of the prefix
        for (let i = 0; i < lowerPrefix.length; i++) {
            let char = lowerPrefix[i];
            if (!current.children[char]) {
                return []; // Prefix not found
            }
            current = current.children[char];
        }

        // Perform Depth First Search (DFS) to find all complete words from this node
        const results = [];
        this._dfs(current, lowerPrefix, results);
        return results;
    }

    _dfs(node, currentWord, results) {
        if (node.isEndOfWord) {
            results.push({ name: currentWord, data: node.eventData });
        }
        for (let char in node.children) {
            this._dfs(node.children[char], currentWord + char, results);
        }
    }
}

module.exports = TrieSearch;