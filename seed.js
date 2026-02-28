const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();

const User = require('./models/User');

const users = [
    { name: 'Admin User',         email: 'admin@clinic.com',   password: 'admin123',  role: 'admin',        subscriptionPlan: 'pro' },
    { name: 'Dr. Ahmed',          email: 'doctor@clinic.com',  password: 'doctor123', role: 'doctor',       subscriptionPlan: 'pro' },
    { name: 'Sara Receptionist',  email: 'recept@clinic.com',  password: 'recept123', role: 'receptionist', subscriptionPlan: 'free' },
    { name: 'Ali Patient',        email: 'patient@clinic.com', password: 'patient123',role: 'patient',      subscriptionPlan: 'free' },
];

const seed = async () => {
    await mongoose.connect(process.env.MONGO_URI, { family: 4 });
    console.log('MongoDB Connected');

    for (const u of users) {
        const exists = await User.findOne({ email: u.email });
        if (exists) {
            console.log(`Skipped (already exists): ${u.email}`);
            continue;
        }
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(u.password, salt);
        await User.create({ ...u, password: hashed });
        console.log(`Created: ${u.email} (${u.role})`);
    }

    console.log('\nDemo accounts ready:');
    users.forEach(u => console.log(`  ${u.role.padEnd(12)} ${u.email} / ${u.password}`));
    process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
