/* eslint-disable react/prop-types */
/* eslint-disable import/prefer-default-export */
import React, { useState } from 'react';
import httpService from '../services/httpService';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPasswordText] = useState('');
  const [message, setMessage] = useState('');
  const onLoginButtonClick = async () => {
    try {
      setMessage('');
      const response = await httpService.post('/user/login', {
        email,
        password,
      }, false);
      const { accessToken } = response.data;
      onLogin(accessToken, email);
    } catch (err) {
      console.log(err);
      setMessage(err.message);
    }
  };

  const onEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const onPasswordChange = (e) => {
    setPasswordText(e.target.value);
  };

  return (
    <div>
      <p>{message}</p>
      <input value={email} type="email" placeholder="enter email" onChange={onEmailChange} />
      <input value={password} type="password" placeholder="enter password" onChange={onPasswordChange} />
      <button type="submit" onClick={onLoginButtonClick}>Login</button>
    </div>
  );
};

export default Login;
