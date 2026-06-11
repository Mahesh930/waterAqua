const express = require('express');
const router = express.Router();
const { getReferralDetails } = require('../controllers/referral.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, getReferralDetails);

module.exports = router;
