const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Start new interview
router.post('/start', auth, async (req, res) => {
  try {
    const { jobRole, jobDescription } = req.body;
    
    const interview = new Interview({
      candidate: req.user.userId,
      jobRole,
      jobDescription,
      status: 'scheduled'
    });

    await interview.save();

    res.status(201).json({
      success: true,
      interview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error starting interview',
      error: error.message
    });
  }
});

// Submit answer for a question
router.post('/:interviewId/answer', auth, async (req, res) => {
  try {
    const { questionIndex, answer } = req.body;
    const interview = await Interview.findById(req.params.interviewId);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    if (interview.candidate.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    interview.questions[questionIndex].answer = answer;
    await interview.save();

    res.json({
      success: true,
      interview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting answer',
      error: error.message
    });
  }
});

// Get interview details
router.get('/:interviewId', auth, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.interviewId)
      .populate('candidate', 'email profile')
      .populate('recruiter', 'email profile');

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check if user has permission to view
    if (
      interview.candidate._id.toString() !== req.user.userId &&
      interview.recruiter?._id.toString() !== req.user.userId &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.json({
      success: true,
      interview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching interview',
      error: error.message
    });
  }
});

// Get all interviews for a user
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const interviews = await Interview.find({
      $or: [
        { candidate: req.params.userId },
        { recruiter: req.params.userId }
      ]
    })
    .populate('candidate', 'email profile')
    .populate('recruiter', 'email profile')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      interviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching interviews',
      error: error.message
    });
  }
});

// Submit recruiter feedback
router.post('/:interviewId/feedback', auth, async (req, res) => {
  try {
    const { shortlisted, comments, rating } = req.body;
    const interview = await Interview.findById(req.params.interviewId);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only recruiters can provide feedback'
      });
    }

    interview.recruiterFeedback = {
      shortlisted,
      comments,
      rating
    };
    interview.status = 'reviewed';
    await interview.save();

    res.json({
      success: true,
      interview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting feedback',
      error: error.message
    });
  }
});

module.exports = router; 