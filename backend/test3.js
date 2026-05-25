const mongoose = require('mongoose');

const SectionSchema = new mongoose.Schema({
  title: String,
  questions: { type: Array, default: [] }
}, { _id: false });

const AssignmentSchema = new mongoose.Schema({
  sections: { type: [SectionSchema], default: [] }
});

const Assignment = mongoose.model('TestAssignment3', AssignmentSchema);

const a = new Assignment();
console.log('sections length:', a.sections.length);
console.log('sections:', a.sections);
