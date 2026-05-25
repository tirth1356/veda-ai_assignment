const mongoose = require('mongoose');

const SectionSchema = new mongoose.Schema({
  title: String,
  questions: { type: Array, default: [] }
}, { _id: false });

const AssignmentSchema = new mongoose.Schema({
  sections: { type: [SectionSchema], default: [] }
});

const Assignment = mongoose.model('TestAssignment', AssignmentSchema);

const a = new Assignment();
console.log('New Assignment sections length:', a.sections.length);

a.sections = [];
console.log('After setting to [], length:', a.sections.length);
