const express = require('express');
const router = express.Router();
const { getAdminStats } = require('../controllers/adminController');
const { verifyToken, authorizeRoles, checkSubscription } = require('../middleware/authMiddleware');

router.route('/stats')
    .get(
        verifyToken,
        authorizeRoles(['admin']),
        checkSubscription('pro'),
        getAdminStats
    );

module.exports = router;
