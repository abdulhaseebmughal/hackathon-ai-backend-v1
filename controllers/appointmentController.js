const Appointment = require('../models/Appointment');

const createAppointment = async (req, res) => {
    try {
        const { patientId, doctorId, date, time, type, reason } = req.body;

        const appointment = await Appointment.create({
            patientId,
            doctorId,
            date,
            time,
            type,
            reason,
        });

        const populated = await Appointment.findById(appointment._id)
            .populate('patientId', 'name email')
            .populate('doctorId', 'name');

        const result = populated.toObject();
        result.patient = result.patientId;
        result.doctor = result.doctorId;

        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAppointments = async (req, res) => {
    try {
        let filter = {};
        if (req.user.role === 'patient') {
            filter = { patientId: req.user._id };
        } else if (req.user.role === 'doctor') {
            filter = { doctorId: req.user._id };
        }

        const appointments = await Appointment.find(filter)
            .populate('patientId', 'name email')
            .populate('doctorId', 'name')
            .sort({ date: -1 })
            .lean();

        // Normalize: add patient/doctor aliases so frontend works
        const normalized = appointments.map(a => ({
            ...a,
            patient: a.patientId,
            doctor: a.doctorId,
        }));

        res.json(normalized);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateAppointmentStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const appointment = await Appointment.findById(req.params.id);

        if (appointment) {
            appointment.status = status;
            const updatedAppointment = await appointment.save();
            res.json(updatedAppointment);
        } else {
            res.status(404).json({ message: 'Appointment not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createAppointment,
    getAppointments,
    updateAppointmentStatus,
};
