const Application = require('./models/Application');
const Company = require('./models/Company');
const Job = require('./models/Job');
const { Conversation, Message } = require('./models/Message');
const Notification = require('./models/Notification');
const User = require('./models/User');

async function seedData() {
  const recruiter = await User.findOneAndUpdate(
    { email: 'recruiter@example.com' },
    {
      fullName: 'Aarav Mehta',
      email: 'recruiter@example.com',
      password: 'password123',
      role: 'recruiter',
      location: 'Bengaluru, India',
      skills: ['Hiring', 'Engineering Leadership'],
      isVerified: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const seeker = await User.findOneAndUpdate(
    { email: 'candidate@example.com' },
    {
      fullName: 'Priya Sharma',
      email: 'candidate@example.com',
      password: 'password123',
      role: 'job_seeker',
      location: 'Pune, India',
      skills: ['React', 'Node.js', 'MongoDB', 'TypeScript'],
      isVerified: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const admin = await User.findOneAndUpdate(
    { email: 'admin@example.com' },
    {
      fullName: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
      isVerified: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const company = await Company.findOneAndUpdate(
    { name: 'NexaTech Solutions' },
    {
      name: 'NexaTech Solutions',
      description: 'A product engineering company building hiring and workflow tools.',
      website: 'https://example.com',
      industry: 'Software',
      companySize: '51-200',
      foundedYear: 2018,
      headquarters: 'Bengaluru, India',
      location: 'Bengaluru, India',
      ownerId: recruiter._id,
      isVerified: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const frontendJob = await Job.findOneAndUpdate(
    { title: 'Frontend Developer', companyId: company._id },
    {
      title: 'Frontend Developer',
      companyId: company._id,
      recruiterId: recruiter._id,
      description: 'Build responsive React interfaces for a fast-growing job platform.',
      responsibilities: ['Create reusable UI components', 'Improve page performance', 'Work with product and backend teams'],
      requirements: ['2+ years of React experience', 'Strong JavaScript fundamentals', 'Comfortable with REST APIs'],
      benefits: ['Flexible work', 'Health insurance', 'Learning budget'],
      skills: ['React', 'TypeScript', 'Tailwind CSS'],
      location: 'Bengaluru, India',
      salaryMin: 800000,
      salaryMax: 1400000,
      experienceMin: 2,
      experienceMax: 5,
      jobType: 'full_time',
      workType: 'hybrid',
      numOpenings: 2,
      status: 'active',
      isFeatured: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Job.findOneAndUpdate(
    { title: 'Backend Developer', companyId: company._id },
    {
      title: 'Backend Developer',
      companyId: company._id,
      recruiterId: recruiter._id,
      description: 'Design APIs, data models, and integrations for recruitment workflows.',
      responsibilities: ['Own Express APIs', 'Model MongoDB collections', 'Build secure integrations'],
      requirements: ['Node.js experience', 'MongoDB knowledge', 'API design skills'],
      benefits: ['Remote-friendly culture', 'Annual bonus', 'Mentorship'],
      skills: ['Node.js', 'Express', 'MongoDB'],
      location: 'Remote',
      salaryMin: 900000,
      salaryMax: 1600000,
      experienceMin: 1,
      experienceMax: 4,
      jobType: 'full_time',
      workType: 'remote',
      numOpenings: 1,
      status: 'active',
      isUrgent: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const application = await Application.findOneAndUpdate(
    { jobId: frontendJob._id, applicantId: seeker._id },
    {
      jobId: frontendJob._id,
      applicantId: seeker._id,
      recruiterId: recruiter._id,
      coverLetter: 'I have strong React experience and would love to work on this platform.',
      status: 'under_review',
      matchScore: 88,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Job.findByIdAndUpdate(frontendJob._id, { applicationCount: 1 });

  const conversation = await Conversation.findOneAndUpdate(
    { participantOne: seeker._id, participantTwo: recruiter._id },
    { participantOne: seeker._id, participantTwo: recruiter._id, jobId: frontendJob._id },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const existingMessage = await Message.findOne({ conversationId: conversation._id });
  if (!existingMessage) {
    await Message.create({
      conversationId: conversation._id,
      senderId: recruiter._id,
      content: 'Thanks for applying. We are reviewing your profile now.',
      isRead: false,
    });
  }

  await Notification.findOneAndUpdate(
    { userId: seeker._id, title: 'Application update' },
    {
      userId: seeker._id,
      type: 'application_update',
      title: 'Application update',
      message: 'Your Frontend Developer application is under review.',
      data: { applicationId: application._id, jobId: frontendJob._id },
      isRead: false,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return {
    users: { recruiter: recruiter._id, seeker: seeker._id, admin: admin._id },
    company: company._id,
    sampleJob: frontendJob._id,
    application: application._id,
    conversation: conversation._id,
  };
}

module.exports = seedData;
