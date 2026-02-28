const mongoose = require('mongoose');

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['admin', 'doctor', 'receptionist', 'patient'],
            default: 'patient',
        },
        subscriptionPlan: {
            type: String,
            enum: ['free', 'pro'],
            default: 'free',
        },
        age: {
            type: Number,
        },
        gender: {
            type: String,
            enum: ['Male', 'Female', 'Other'],
        },
        phone: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
