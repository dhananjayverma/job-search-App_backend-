const express = require('express');
const Application = require('../models/Application');
const Job = require('../models/Job');
const { Conversation } = require('../models/Message');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const query = {};
    if (req.query.applicantId) query.applicantId = req.query.applicantId;
    if (req.query.recruiterId) query.recruiterId = req.query.recruiterId;
    if (req.query.jobId) query.jobId = req.query.jobId;
    if (req.query.status) query.status = req.query.status;

    const applications = await Application.find(query)
      .populate({ path: 'jobId', populate: { path: 'companyId' } })
      .populate('applicantId', '-password')
      .populate('recruiterId', '-password')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { jobId, applicantId } = req.body;
    if (!jobId || !applicantId) {
      return res.status(400).json({ error: 'jobId and applicantId are required' });
    }

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const application = await Application.create({
      ...req.body,
      recruiterId: req.body.recruiterId || job.recruiterId,
    });

    await Job.findByIdAndUpdate(jobId, { $inc: { applicationCount: 1 } });

    res.status(201).json(application);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'You have already applied to this job' });
    }
    next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const application = await Application.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!application) return res.status(404).json({ error: 'Application not found' });

    if (req.body.status === 'rejected') {
      const query = {
        $or: [
          { participantOne: application.applicantId, participantTwo: application.recruiterId },
          { participantOne: application.recruiterId, participantTwo: application.applicantId },
        ],
      };
      if (application.jobId) query.jobId = application.jobId;

      const conversation = await Conversation.findOne(query);
      if (conversation) {
        conversation.blockedBy = application.recruiterId;
        conversation.blockedAt = new Date();
        await conversation.save();
      }
    }

    res.json(application);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const application = await Application.findByIdAndDelete(req.params.id);
    if (!application) return res.status(404).json({ error: 'Application not found' });

    if (application.jobId) {
      await Job.findByIdAndUpdate(application.jobId, { $inc: { applicationCount: -1 } });
    }

    res.json({ message: 'Application deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
