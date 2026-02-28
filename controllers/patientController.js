const Patient = require('../models/Patient');

const createPatient = async (req, res) => {
    try {
        const { name, age, gender, contact } = req.body;

        const patient = await Patient.create({
            name,
            age,
            gender,
            contact,
            createdBy: req.user._id,
        });

        res.status(201).json(patient);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getPatients = async (req, res) => {
    try {
        const patients = await Patient.find({});
        res.json(patients);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getPatientById = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);

        if (patient) {
            res.json(patient);
        } else {
            res.status(404).json({ message: 'Patient not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updatePatient = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);

        if (patient) {
            patient.name = req.body.name || patient.name;
            patient.age = req.body.age || patient.age;
            patient.gender = req.body.gender || patient.gender;
            patient.contact = req.body.contact || patient.contact;

            const updatedPatient = await patient.save();
            res.json(updatedPatient);
        } else {
            res.status(404).json({ message: 'Patient not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createPatient,
    getPatients,
    getPatientById,
    updatePatient,
};
