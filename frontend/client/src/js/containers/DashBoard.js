import React, { useState, useEffect } from 'react';
import httpService from '../services/httpService';
// eslint-disable-next-line import/no-cycle
import { accessTokenContext } from '../App';

const DashBoard = () => {
  const context = React.useContext(accessTokenContext);
  const [userDetails, setUserDetails] = useState({});

  const fetchUserDetails = async () => {
    const response = await httpService.get('/user', context.accessToken);
    setUserDetails(response.data);
  };

  useEffect(async () => {
    await fetchUserDetails();
  }, []);
  return (
    <div>
      <p>FirstName:</p>
      <span>{userDetails.firstName}</span>
      <p>LastName:</p>
      <span>{userDetails.lastName}</span>
    </div>
  );
};

export default DashBoard;
