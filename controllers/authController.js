const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id, role, subscriptionPlan) => {
    return jwt.sign({ userId: id, role, subscriptionPlan }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
};

const registerUser = async (req, res) => {
    try {
        const { name, email, password, role, subscriptionPlan } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'patient',
            subscriptionPlan: subscriptionPlan || 'free',
        });

        if (user) {
            res.status(201).json({
                token: generateToken(user._id, user.role, user.subscriptionPlan),
                user: {
                    _id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    subscriptionPlan: user.subscriptionPlan,
                },
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                token: generateToken(user._id, user.role, user.subscriptionPlan),
                user: {
                    _id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    subscriptionPlan: user.subscriptionPlan,
                },
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/users?role=doctor|patient|receptionist|admin
const getUsers = async (req, res) => {
    try {
        const filter = {};
        if (req.query.role) filter.role = req.query.role;
        const users = await User.find(filter).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/users/:id
const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (req.body.name) user.name = req.body.name;
        if (req.body.email) user.email = req.body.email;
        if (req.body.subscriptionPlan) user.subscriptionPlan = req.body.subscriptionPlan;
        if (req.body.age !== undefined) user.age = req.body.age || undefined;
        if (req.body.gender) user.gender = req.body.gender;
        if (req.body.phone !== undefined) user.phone = req.body.phone;

        const updated = await user.save();
        const { password: _, ...userData } = updated.toObject();
        res.json(userData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUsers,
    updateUser,
};
