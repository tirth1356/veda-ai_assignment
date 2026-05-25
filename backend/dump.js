const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const Assignment = mongoose.models.Assignment || mongoose.model('Assignment', new mongoose.Schema({}, { strict: false }));
  
  const assignments = await Assignment.find().sort({ createdAt: -1 }).limit(3);
  console.log(JSON.stringify(assignments, null, 2));
  process.exit(0);
}

run();
