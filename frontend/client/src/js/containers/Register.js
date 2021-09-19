import React, { useState } from 'react';
import axios from 'axios';
import OtpValidation from '../components/OtpValidation';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [otpScreen, setOtpScreen] = useState(false);
  const onEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const onPasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const onConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
  };

  const onFirstNameChange = (e) => {
    setFirstName(e.target.value);
  };

  const onLastNameChange = (e) => {
    setLastName(e.target.value);
  };

  const onRegisterButtonClick = async () => {
    // console.log('Registering');
    try {
      await axios.post('/user/register', {
        email,
        firstName,
        lastName,
        password,
      });
      setOtpScreen(true);
    } catch (err) {
      console.log(err);
    }
  };
  return (
    <div>
      { otpScreen ? <OtpValidation email={email} type="USER_REGISTRATION" redirectionMessage="Please login now" />
        : (
          <div>
            <input value={email} type="email" placeholder="enter email" onChange={onEmailChange} />
            <input value={firstName} placeholder="enter firstname" onChange={onFirstNameChange} />
            <input value={lastName} placeholder="enter lastname" onChange={onLastNameChange} />
            <input value={password} type="password" placeholder="enter password" onChange={onPasswordChange} />
            <input value={confirmPassword} type="password" placeholder="confirm password" onChange={onConfirmPasswordChange} />
            <button type="submit" onClick={onRegisterButtonClick}>Register</button>
          </div>
        )}
    </div>
  );
};

export default Register;
