const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema(
  {
    title: String,
    company: String,
    duration: String,
    description: String,
  },
  { _id: false }
);

const educationSchema = new mongoose.Schema(
  {
    institute: String,
    degree: String,
    year: String,
    description: String,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['job_seeker', 'recruiter', 'admin'],
      default: 'job_seeker',
    },
    avatarUrl: String,
    bio: String,
    phone: String,
    location: String,
    headline: String,
    skills: [{ type: String, trim: true }],
    achievements: [{ type: String, trim: true }],
    experience: [experienceSchema],
    education: [educationSchema],
    languages: [{ type: String, trim: true }],
    linkedinUrl: String,
    githubUrl: String,
    portfolioUrl: String,
    resumeUrl: String,
    isVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
