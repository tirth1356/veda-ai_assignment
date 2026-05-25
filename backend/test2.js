const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const SectionSchema = new mongoose.Schema({
    title: String,
    questions: { type: Array, default: [] }
  }, { _id: false });

  const AssignmentSchema = new mongoose.Schema({
    sections: { type: [SectionSchema], default: [] }
  });

  const Assignment = mongoose.models.TestAssignment || mongoose.model('TestAssignment', AssignmentSchema);

  // create one with sections
  let a = new Assignment({ sections: [{ title: 'Section A', questions: [] }] });
  await a.save();
  console.log('Saved with sections length:', a.sections.length);

  // load it
  a = await Assignment.findById(a._id);
  console.log('Loaded sections length:', a.sections.length);

  // clear it
  a.sections = [];
  await a.save();

  // load it again
  a = await Assignment.findById(a._id);
  console.log('After setting to [] and saving, loaded sections length:', a.sections.length);
  
  process.exit(0);
}

run();
