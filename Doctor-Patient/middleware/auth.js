import jwt from 'jsonwebtoken';
import { doctor } from '../models/doctor.js';
import { patient } from '../models/patient.js';
// import { admin } from '../models/admin.js';

// Generate JWT token
export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Verify JWT token
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                  req.cookies?.token || 
                  req.session?.token;

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = verifyToken(token);
    let user;

    switch (decoded.userType) {
      case 'doctor':
        user = await doctor.findById(decoded.userId).select('-password');
        break;
      case 'patient':
        user = await patient.findById(decoded.userId).select('-password');
        break;
      case 'admin':
        // Admin uses simple credentials
        user = { _id: 'admin', name: 'Admin', email: 'admin@medicare.com', userType: 'admin' };
        break;
      default:
        return res.status(401).json({ error: 'Invalid token.' });
    }

    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }

    req.user = user;
    req.userType = decoded.userType;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// Authorization middleware
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (roles.includes(req.userType)) {
      next();
    } else {
      res.status(403).json({ error: 'Insufficient permissions.' });
    }
  };
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                  req.cookies?.token || 
                  req.session?.token;

    if (token) {
      const decoded = verifyToken(token);
      let user;

      switch (decoded.userType) {
        case 'doctor':
          user = await doctor.findById(decoded.userId).select('-password');
          break;
        case 'patient':
          user = await patient.findById(decoded.userId).select('-password');
          break;
        case 'admin':
          user = { _id: 'admin', name: 'Admin', email: 'admin@medicare.com', userType: 'admin' };
          break;
      }

      if (user) {
        req.user = user;
        req.userType = decoded.userType;
      }
    }
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};


