const SegmentTree = require('./dsa/SegmentTree');
const TrieSearch = require('./dsa/TrieSearch');
const WaitlistHeap = require('./dsa/WaitlistHeap');

console.log("=== SMART SEAT: ENGINE TEST ===\n");

// --- 1. Testing Segment Tree ---
console.log("--- 1. Testing Segment Tree (Seat Booking) ---");
const rowA = new SegmentTree(20);

console.log("Booking 4 contiguous seats for a group...");
const b1 = rowA.bookContiguous(4);
console.log(`Result: Booked seats from index ${b1.start} to ${b1.end}`);

console.log("Booking 5 contiguous seats for a family...");
const b2 = rowA.bookContiguous(5);
console.log(`Result: Booked seats from index ${b2.start} to ${b2.end}\n`);


// --- 2. Testing Trie ---
console.log("--- 2. Testing Trie (Auto-Complete Search) ---");
const searchEngine = new TrieSearch();

searchEngine.insert("Acoustic Night", { id: 1, venue: "Main Hall" });
searchEngine.insert("Action Sports Expo", { id: 2, venue: "Stadium" });
searchEngine.insert("Art Gallery Opening", { id: 3, venue: "Exhibit Room" });
searchEngine.insert("Jazz Festival", { id: 4, venue: "Park" });

console.log("User types 'Ac' into the search bar...");
const suggestions = searchEngine.getSuggestions("Ac");
console.log("Suggestions found:", suggestions);


// --- 3. Testing Waitlist Min-Heap ---
console.log("\n--- 3. Testing Priority Waitlist (Min-Heap) ---");
const concertWaitlist = new WaitlistHeap();

setTimeout(() => {
    console.log("Adding General User: Alice (Tier 2)");
    concertWaitlist.enqueue("Alice", 2);
}, 10);

setTimeout(() => {
    console.log("Adding VIP User: Bob (Tier 1)");
    concertWaitlist.enqueue("Bob", 1);
}, 20);

setTimeout(() => {
    console.log("Adding General User: Charlie (Tier 2)");
    concertWaitlist.enqueue("Charlie", 2);
}, 30);

setTimeout(() => {
    console.log("Adding VIP User: Dave (Tier 1)");
    concertWaitlist.enqueue("Dave", 1);
    
    console.log("\nSomeone cancelled! Resolving waitlist line-up:");
    console.log("1st to get seat:", concertWaitlist.dequeue().user, "(Should be Bob - First VIP)");
    console.log("2nd to get seat:", concertWaitlist.dequeue().user, "(Should be Dave - Second VIP)");
    console.log("3rd to get seat:", concertWaitlist.dequeue().user, "(Should be Alice - First General)");
    console.log("4th to get seat:", concertWaitlist.dequeue().user, "(Should be Charlie - Second General)");
    
    console.log("\n=== PHASE 1 COMPLETE ===");
}, 40);