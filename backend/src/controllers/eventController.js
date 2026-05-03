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
    const results = searchEngine.getSuggestions(query);
    res.json(results);
};

exports.bookSeats = async (req, res) => {
    const { eventId, userName, numSeats, tier } = req.body; 
    const booking = vipRow.bookContiguous(numSeats);

    if (booking) {
        await supabase.from('bookings').insert([
            { event_id: eventId, user_name: userName, seat_start: booking.start, seat_end: booking.end }
        ]);
        return res.json({ 
            status: 'success', 
            message: `Successfully booked contiguous seats ${booking.start} through ${booking.end}`,
            seats: booking
        });
    } else {
        waitlist.enqueue(userName, tier);
        return res.json({
            status: 'waitlisted',
            message: `Not enough contiguous seats. ${userName} added to waitlist.`,
            waitlist_size: waitlist.heap.length
        });
    }
};

exports.getNextWaitlist = (req, res) => {
    const nextUser = waitlist.peek();
    if (!nextUser) return res.json({ message: "Waitlist is empty." });
    res.json({ next_in_line: nextUser });
};

// Admin: Cancel Booking & Auto-Resolve Waitlist
exports.cancelBooking = async (req, res) => {
    try {
        const { startIndex, endIndex } = req.body;

        // 1. Unbook seats in Segment Tree
        vipRow.update(1, 0, vipRow.size - 1, parseInt(startIndex), parseInt(endIndex), 1);
        
        let resolvedUser = null;
        let resolvedSeats = null;

        // 2. Resolve Min-Heap Waitlist
        if (!waitlist.isEmpty()) {
            const nextInLine = waitlist.peek();
            const numSeatsNeeded = 1; 

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
        console.error(error);
        res.status(500).json({ error: 'Server error during cancellation' });
    }
};