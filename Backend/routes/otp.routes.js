const express = require('express');
const router  = express.Router();
const {
  sendEmailOTP,
  sendPhoneOTP,
  verifyOTP,
  forgotPassword,
  resetPassword,
  testEmail,
} = require('../controllers/otp.controller');

router.get('/test-email',      testEmail);       // test: localhost:5000/api/otp/test-email?to=you@gmail.com
router.post('/send-email',     sendEmailOTP);    // registration email OTP
router.post('/send-phone',     sendPhoneOTP);    // registration phone OTP
router.post('/verify',         verifyOTP);       // verify any OTP
router.post('/forgot-password',forgotPassword);  // send reset OTP to email
router.post('/reset-password', resetPassword);   // save new password

module.exports = router;