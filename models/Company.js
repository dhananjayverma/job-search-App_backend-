const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    logoUrl: String,
    description: String,
    website: String,
    industry: String,
    companySize: String,
    foundedYear: Number,
    headquarters: String,
    location: String,
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Company', companySchema);
