const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

// GET /api/events/search?query=Ac
router.get('/search', eventController.searchEvents);

// POST /api/events/book
router.post('/book', eventController.bookSeats);

// GET /api/events/waitlist/next
router.get('/waitlist/next', eventController.getNextWaitlist);
// POST /api/events/cancel
router.post('/cancel', eventController.cancelBooking);

module.exports = router;