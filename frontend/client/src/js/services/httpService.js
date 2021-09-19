import axios from 'axios';
// import { useNavigate } from 'react-router-dom';

// import { useReducer } from 'react';
// import { useNavigate } from 'react-router-dom';
// import accessTokenReducer from '../reducers/accessTokenReducer';

// const [accessTokenState, dispatch] = useReducer(accessTokenReducer, {});
// const navigateTo = useNavigate();
const httpService = {
//   async getBearerToken() {
//     try {
//       // eslint-disable-next-line prefer-const
//       // let { token, email } = accessTokenState;
//       // silent login using refresh token
//       accessTokenService.
//       if (!token) {
//         const response = await this.post('/user/token', { email }, false);
//         token = response.data.accessToken;
//         // dispatch({ type: 'update', payload: token });
//         accessTokenService.set
//       }
//       return { Authorization: `Bearer ${token}` };
//     } catch (e) {
//       console.log(e);
//       // if silent login also fails then redirect to login
//       useNavigate('/');
//     }
//     return null;
//   },

  async post(url, params, accessToken) {
    return accessToken ? axios.post(url, params, { headers: { Authorization: `Bearer ${accessToken}` } })
      : axios.post(url, params);
  },
  async get(url, accessToken) {
    return accessToken ? axios.get(url, { headers: { Authorization: `Bearer ${accessToken}` } })
      : axios.get(url);
  },
};

export default httpService;
