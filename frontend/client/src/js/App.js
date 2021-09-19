import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// eslint-disable-next-line import/no-cycle
import Login from './containers/Login';
import Register from './containers/Register';
// eslint-disable-next-line import/no-cycle
import DashBoard from './containers/DashBoard';
import httpService from './services/httpService';

export const accessTokenContext = React.createContext(null);

const App = () => {
  const [tokenDetails, setTokenDetails] = useState({ email: localStorage.getItem('email') });
  const [showSpinner, setShowSpinner] = useState(true);
  let intervalId;
  let startInterval = false;

  const silentLogin = async () => {
    try {
      if (tokenDetails.email && !tokenDetails.accessToken) {
        const response = await httpService.post('/user/token', { email: tokenDetails.email });
        const newToken = response.data.accessToken;
        setTokenDetails({ ...tokenDetails, accessToken: newToken });
        startInterval = true;
      }
    } catch (e) {
      console.log('cleared the token as unable to update it using refresh token', e);
      setTokenDetails({ ...tokenDetails, accessToken: '' });
      if (intervalId) intervalId = clearInterval(intervalId);
      startInterval = false;
    }
  };

  const setMonitor = () => {
    if (startInterval && !intervalId) {
      intervalId = setInterval(async () => {
        await silentLogin();
      }, 1000 * 30);
      startInterval = false;
    }
  };

  useEffect(async () => {
    await silentLogin();
    setShowSpinner(false);
    setMonitor();
  }, []);

  const onLogin = (accessToken, email) => {
    localStorage.setItem('email', email);
    setTokenDetails({ accessToken, email });
    startInterval = true;
    setMonitor();
  };

  const onLogoff = async () => {
    console.log('user logged off');
    try {
      await httpService.post('/user/logoff', null, tokenDetails.accessToken);
      localStorage.removeItem('email');
      setTokenDetails({});
    } catch (e) {
      console.log('Unable to logoff now, please try later');
    }
  };

  return (
    <div>
      {!showSpinner && (
      <accessTokenContext.Provider value={tokenDetails}>
        <button type="submit" onClick={onLogoff}>Logoff</button>
        <Router>
          <Routes>
            <Route path="/register">
              <Register />
            </Route>
            <Route path="/">
              { tokenDetails.accessToken ? <DashBoard /> : <Login onLogin={onLogin} />}
            </Route>
          </Routes>
        </Router>
      </accessTokenContext.Provider>
      )}
    </div>
  );
};

export default App;
