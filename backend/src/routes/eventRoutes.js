const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

router.get('/search', eventController.searchEvents);
router.post('/book', eventController.bookSeats);
router.post('/book-specific', eventController.bookSpecific); // New manual booking
router.post('/cancel', eventController.cancelBooking);
router.post('/reset', eventController.resetEngine);
router.get('/export', eventController.exportReport); // New TXT export

module.exports = router;