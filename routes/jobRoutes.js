const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Company = require('../models/Company');
const Job = require('../models/Job');
const User = require('../models/User');

const router = express.Router();
const logoDir = path.join(__dirname, '..', 'uploads', 'logos');
fs.mkdirSync(logoDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, logoDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, `logo-${Date.now()}${ext || '.png'}`);
  },
});
const upload = multer({ storage });

const populateJob = [
  { path: 'companyId', model: 'Company' },
  { path: 'recruiterId', model: 'User', select: '-password' },
];

router.get('/', async (req, res, next) => {
  try {
    const query = {};
    const { search, location, jobType, workType, status = 'active', recruiterId } = req.query;

    if (status !== 'all') query.status = status;
    if (recruiterId) query.recruiterId = recruiterId;
    if (location) query.location = new RegExp(location, 'i');
    if (jobType) query.jobType = jobType;
    if (workType) query.workType = workType;
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { skills: new RegExp(search, 'i') },
      ];
    }

    const jobs = await Job.find(query)
      .populate(populateJob)
      .sort({ isFeatured: -1, isUrgent: -1, createdAt: -1 })
      .limit(100);

    res.json(jobs);
  } catch (error) {
    next(error);
  }
});

router.get('/companies', async (req, res, next) => {
  try {
    const companies = await Company.find().sort({ name: 1 });
    res.json(companies);
  } catch (error) {
    next(error);
  }
});

router.post('/companies', async (req, res, next) => {
  try {
    const company = await Company.create(req.body);
    res.status(201).json(company);
  } catch (error) {
    next(error);
  }
});

router.post('/companies/:id/logo', upload.single('logo'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Logo file is required' });
    }

    const logoUrl = `${req.protocol}://${req.get('host')}/uploads/logos/${req.file.filename}`;
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { logoUrl },
      { new: true }
    );

    if (!company) return res.status(404).json({ error: 'Company not found' });
    res.json(company);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate(populateJob);

    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { recruiterId, companyId, title, description, experienceMin } = req.body;

    if (!recruiterId || !companyId || !title || !description) {
      return res.status(400).json({ error: 'recruiterId, companyId, title, and description are required' });
    }
    if (experienceMin === undefined || experienceMin === null || Number.isNaN(Number(experienceMin))) {
      return res.status(400).json({ error: 'experienceMin is required (use 0 for fresher roles)' });
    }

    const [recruiter, company] = await Promise.all([
      User.findById(recruiterId),
      Company.findById(companyId),
    ]);

    if (!recruiter) return res.status(404).json({ error: 'Recruiter not found' });
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const job = await Job.create({
      ...req.body,
      experienceMin: Number(experienceMin),
      experienceMax:
        req.body.experienceMax === undefined || req.body.experienceMax === null || req.body.experienceMax === ''
          ? null
          : Number(req.body.experienceMax),
    });
    res.status(201).json(await job.populate(populateJob));
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate(populateJob);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({ message: 'Job deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
