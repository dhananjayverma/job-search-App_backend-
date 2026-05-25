const dotenv = require('dotenv');
const mongoose = require('mongoose');
const seedData = require('./seedData');

dotenv.config();

async function run() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/job-portal';

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  const result = await seedData();
  console.log('Sample backend data added:', result);
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error('Seed failed:', error.message);
  await mongoose.disconnect();
  process.exit(1);
});
