const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Mission Template Schema
const MissionTemplateSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['learning', 'skill_building', 'networking', 'project', 'assessment', 'reflection']
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['beginner', 'intermediate', 'advanced', 'expert']
  },
  // Additional schema fields...
});

module.exports = mongoose.model('MissionTemplate', MissionTemplateSchema);