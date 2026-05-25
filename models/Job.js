const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true },
    responsibilities: [{ type: String }],
    requirements: [{ type: String }],
    benefits: [{ type: String }],
    skills: [{ type: String, trim: true }],
    location: String,
    salaryMin: Number,
    salaryMax: Number,
    salaryCurrency: { type: String, default: 'INR' },
    experienceMin: { type: Number, default: 0 },
    experienceMax: Number,
    jobType: {
      type: String,
      enum: ['full_time', 'part_time', 'internship', 'contract', 'freelance'],
      default: 'full_time',
    },
    workType: {
      type: String,
      enum: ['remote', 'hybrid', 'onsite'],
      default: 'onsite',
    },
    numOpenings: { type: Number, default: 1 },
    deadline: Date,
    status: {
      type: String,
      enum: ['active', 'closed', 'draft', 'expired'],
      default: 'active',
    },
    isFeatured: { type: Boolean, default: false },
    isUrgent: { type: Boolean, default: false },
    applicationCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    aiMatchEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Job', jobSchema);
