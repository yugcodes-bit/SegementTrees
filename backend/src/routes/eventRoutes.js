const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

router.get('/search', eventController.searchEvents);
router.post('/book', eventController.bookSeats);
router.get('/waitlist/next', eventController.getNextWaitlist);
router.post('/cancel', eventController.cancelBooking);
router.post('/reset', eventController.resetEngine);

module.exports = router;