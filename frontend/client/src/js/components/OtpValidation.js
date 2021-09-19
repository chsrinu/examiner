/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable react/prop-types */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const OtpValidation = ({ email, type, redirectionMessage }) => {
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const navigateTo = useNavigate();
  const onOtpSubmission = async () => {
    try {
      setMessage('');
      await axios.post('/user/verifyOtp', {
        email,
        otp,
      });
      setMessage(`email verified successfully, ${redirectionMessage}`);
      // navigate to login page
      setTimeout(() => {
        navigateTo('/');
      }, 5000);
    } catch (e) {
      console.log(e);
      setMessage(e.message);
    }
  };

  const resendOtp = async () => {
    try {
      await axios.post('user/emailVerification', {
        email,
        type,
      });
    } catch (e) {
      console.log(e);
      setMessage(e.message);
    }
  };

  const onOtpChange = (e) => {
    setOtp(e.target.value);
  };
  return (
    <div>
      <p>{message}</p>
      <input value={otp} onChange={onOtpChange} type="text" placeholder="Enter OTP sent to your email" />
      <button type="submit" onClick={onOtpSubmission}>Submit</button>
      <div>
        <a href="#" onClick={resendOtp}>Resend Otp</a>
      </div>
    </div>
  );
};

export default OtpValidation;
