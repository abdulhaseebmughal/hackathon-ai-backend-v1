const express = require('express');
const router = express.Router();
const { getUsers, updateUser } = require('../controllers/authController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/', verifyToken, authorizeRoles(['admin', 'doctor', 'receptionist', 'patient']), getUsers);
router.put('/:id', verifyToken, authorizeRoles(['admin', 'receptionist']), updateUser);

module.exports = router;
