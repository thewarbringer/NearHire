const redisClient = require('../config/redis');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.slice(7);
    const userId = await redisClient.get(`token:${token}`);
    if (!userId) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    req.userId = userId;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = verifyToken;
