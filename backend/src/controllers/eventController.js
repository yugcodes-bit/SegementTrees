const { createClient } = require('@supabase/supabase-js');
const SegmentTree = require('../dsa/SegmentTree');
const TrieSearch = require('../dsa/TrieSearch');
const WaitlistHeap = require('../dsa/WaitlistHeap');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const searchEngine = new TrieSearch();
const waitlist = new WaitlistHeap();
const vipRow = new SegmentTree(50); 

const initializeSearch = async () => {
    const { data: events, error } = await supabase.from('events').select('*');
    if (events) {
        events.forEach(event => searchEngine.insert(event.name, event));
        console.log(`\n✅ Loaded ${events.length} events into the Trie Search Engine`);
    }
};
initializeSearch();

exports.searchEvents = (req, res) => {
    const { query } = req.query;
    if (!query) return res.json([]);
    res.json(searchEngine.getSuggestions(query));
};

exports.bookSeats = async (req, res) => {
    const { eventId, userName, numSeats, tier } = req.body; 
    const booking = vipRow.bookContiguous(numSeats);

    if (booking) {
        // Save to DB...
        return res.json({ 
            status: 'success', 
            message: `Successfully booked contiguous seats ${booking.start} through ${booking.end}`,
            seats: booking
        });
    } else {
        // FIX: We now pass numSeats to the heap!
        waitlist.enqueue(userName, tier, numSeats);
        return res.json({
            status: 'waitlisted',
            message: `Not enough contiguous seats. ${userName} added to waitlist.`,
            waitlist_size: waitlist.heap.length
        });
    }
};

// NEW: Manual Specific Seat Booking
exports.bookSpecific = async (req, res) => {
    const { userName, seatIndices } = req.body; 
    // seatIndices is an array like [4, 12, 13]
    
    // O(log N) update for each selected seat
    for (let idx of seatIndices) {
        vipRow.update(1, 0, vipRow.size - 1, parseInt(idx), parseInt(idx), 0);
    }
    
    res.json({ 
        status: 'success', 
        message: `Successfully booked exact seats: ${seatIndices.join(', ')}`,
        seats: seatIndices
    });
};

exports.cancelBooking = async (req, res) => {
    try {
        const { startIndex, endIndex } = req.body;
        vipRow.update(1, 0, vipRow.size - 1, parseInt(startIndex), parseInt(endIndex), 1);
        
        let resolvedUser = null;
        let resolvedSeats = null;

        if (!waitlist.isEmpty()) {
            const nextInLine = waitlist.peek();
            const numSeatsNeeded = nextInLine.numSeats; // FIX: Now asks for exactly what they wanted!

            const booking = vipRow.bookContiguous(numSeatsNeeded);

            if (booking) {
                waitlist.dequeue();
                resolvedUser = nextInLine.user;
                resolvedSeats = booking;
            }
        }

        res.json({
            status: 'success',
            message: `Seats ${startIndex} to ${endIndex} cancelled.`,
            waitlistResolved: resolvedUser ? true : false,
            resolvedUser: resolvedUser,
            resolvedSeats: resolvedSeats,
            waitlist_size: waitlist.heap.length
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error during cancellation' });
    }
};

exports.resetEngine = (req, res) => {
    vipRow.build(1, 0, vipRow.size - 1);
    waitlist.heap = [];
    res.json({ status: 'success', message: 'DSA Engine Memory Wiped Clean.' });
};

// NEW: Admin TXT Export
exports.exportReport = (req, res) => {
    let report = "========================================\n";
    report += "   SMARTSEAT SYSTEM - LIVE SERVER REPORT\n";
    report += "========================================\n\n";

    report += `TOTAL SEAT CAPACITY REMAINING: ${vipRow.treeMax[1]} (Max Contiguous Block)\n\n`;

    report += "--- WAITLIST QUEUE (MIN-HEAP LOG) ---\n";
    if (waitlist.isEmpty()) {
        report += "Waitlist is currently empty.\n";
    } else {
        waitlist.heap.forEach((node, i) => {
            report += `${i + 1}. User: ${node.user} | Priority Tier: ${node.tier} | Seats Requested: ${node.numSeats}\n`;
        });
    }
    
    res.setHeader('Content-disposition', 'attachment; filename=SmartSeat_Admin_Report.txt');
    res.setHeader('Content-type', 'text/plain');
    res.send(report);
};