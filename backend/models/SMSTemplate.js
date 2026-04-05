const mongoose = require('mongoose');

const SMSTemplateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['missed', 'callback', 'busy', 'custom'],
    default: 'custom'
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Default templates that will be created for each new user
const DEFAULT_TEMPLATES = [
  {
    name: 'Missed Call - Default',
    content: "Hi, I missed your call. I'll call you back as soon as possible.",
    category: 'missed',
    isDefault: true
  },
  {
    name: 'Callback Scheduled',
    content: "Hi {{caller}}, I've scheduled a callback for {{time}}. Talk to you then!",
    category: 'callback',
    isDefault: true
  },
  {
    name: 'Busy at Work',
    content: "Hi, I'm currently in meetings. I'll reach out after work.",
    category: 'busy',
    isDefault: true
  }
];

SMSTemplateSchema.statics.createDefaultTemplates = async function(userId) {
  const templates = DEFAULT_TEMPLATES.map(t => ({
    ...t,
    userId
  }));
  return this.insertMany(templates);
};

module.exports = mongoose.model('SMSTemplate', SMSTemplateSchema);
module.exports.DEFAULT_TEMPLATES = DEFAULT_TEMPLATES;
