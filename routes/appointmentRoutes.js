const express = require('express');
const router = express.Router();
const {
    createAppointment,
    getAppointments,
    updateAppointmentStatus,
} = require('../controllers/appointmentController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.route('/')
    .post(verifyToken, authorizeRoles(['admin', 'receptionist', 'patient']), createAppointment)
    .get(verifyToken, getAppointments);
// getAppointments controller handles filtering based on role

router.route('/:id/status')
    .patch(verifyToken, authorizeRoles(['admin', 'doctor', 'receptionist']), updateAppointmentStatus);

module.exports = router;
