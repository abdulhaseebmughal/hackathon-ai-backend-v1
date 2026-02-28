const express = require('express');
const router = express.Router();
const {
    createPatient,
    getPatients,
    getPatientById,
    updatePatient,
} = require('../controllers/patientController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.route('/')
    .post(verifyToken, authorizeRoles(['admin', 'receptionist']), createPatient)
    .get(verifyToken, authorizeRoles(['admin', 'receptionist', 'doctor']), getPatients);

router.route('/:id')
    .get(verifyToken, authorizeRoles(['admin', 'receptionist', 'doctor']), getPatientById)
    .put(verifyToken, authorizeRoles(['admin', 'receptionist']), updatePatient);

module.exports = router;
