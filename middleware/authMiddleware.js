const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.userId).select('-password');

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const authorizeRoles = (rolesArray) => {
    return (req, res, next) => {
        if (!req.user || !rolesArray.includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized for this role' });
        }
        next();
    };
};

const checkSubscription = (requiredPlan) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Pro can access free and pro routes. Free can only access free.
        // If requiredPlan is pro, user must be pro
        if (requiredPlan === 'pro' && req.user.subscriptionPlan !== 'pro') {
            return res.status(403).json({ message: 'Requires Pro subscription' });
        }

        next();
    };
};

module.exports = { verifyToken, authorizeRoles, checkSubscription };
