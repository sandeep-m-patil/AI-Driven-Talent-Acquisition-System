const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobRole: {
    type: String,
    required: true
  },
  jobDescription: {
    type: String,
    required: true
  },
  questions: [{
    question: String,
    answer: {
      videoUrl: String,
      transcript: String,
      duration: Number
    },
    aiFeedback: {
      clarity: Number,
      confidence: Number,
      bodyLanguage: Number,
      technicalAccuracy: Number,
      overallScore: Number,
      feedback: String
    }
  }],
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'reviewed'],
    default: 'scheduled'
  },
  recruiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  recruiterFeedback: {
    shortlisted: Boolean,
    comments: String,
    rating: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  totalScore: Number,
  aiAnalysis: {
    overallPerformance: Number,
    strengths: [String],
    areasForImprovement: [String],
    technicalScore: Number,
    communicationScore: Number
  }
});

// Calculate total score before saving
interviewSchema.pre('save', function(next) {
  if (this.questions && this.questions.length > 0) {
    const totalScore = this.questions.reduce((sum, q) => 
      sum + (q.aiFeedback ? q.aiFeedback.overallScore : 0), 0) / this.questions.length;
    this.totalScore = totalScore;
  }
  next();
});

const Interview = mongoose.model('Interview', interviewSchema);

module.exports = Interview; 