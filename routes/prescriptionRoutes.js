const express = require('express');
const router = express.Router();
const {
    createPrescription,
    getDoctorPrescriptions,
    getPrescriptionsByPatient,
} = require('../controllers/prescriptionController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.route('/')
    .post(verifyToken, authorizeRoles(['doctor']), createPrescription)
    .get(verifyToken, getDoctorPrescriptions);

router.route('/patient/:patientId')
    .get(verifyToken, getPrescriptionsByPatient);

module.exports = router;
