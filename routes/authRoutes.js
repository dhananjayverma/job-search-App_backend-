const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const User = require('../models/User');

const router = express.Router();
const resumeDir = path.join(__dirname, '..', 'uploads', 'resumes');
fs.mkdirSync(resumeDir, { recursive: true });

const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, resumeDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, `resume-${Date.now()}${ext || '.pdf'}`);
  },
});
const uploadResume = multer({ storage: resumeStorage });

const createToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'dev-secret', {
    expiresIn: '7d',
  });

const publicUser = (user) => {
  const data = user.toObject();
  delete data.password;
  return data;
};

const authUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

router.post('/register', async (req, res, next) => {
  try {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'fullName, email, and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    const user = await User.create({ fullName, email, password, role });
    res.status(201).json({ token: createToken(user), user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({ token: createToken(user), user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.get('/users', async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
});

router.get('/me', authUser, async (req, res) => {
  res.json(publicUser(req.user));
});

router.patch('/me', authUser, async (req, res, next) => {
  try {
    const allowedFields = [
      'fullName',
      'bio',
      'phone',
      'location',
      'headline',
      'skills',
      'achievements',
      'experience',
      'education',
      'languages',
      'linkedinUrl',
      'githubUrl',
      'portfolioUrl',
      'resumeUrl',
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    });

    const updated = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json(publicUser(updated));
  } catch (error) {
    next(error);
  }
});

router.post('/me/resume', authUser, uploadResume.single('resume'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Resume file is required' });

    const resumeUrl = `${req.protocol}://${req.get('host')}/uploads/resumes/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user._id, { resumeUrl }, { new: true });
    res.json(publicUser(user));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
