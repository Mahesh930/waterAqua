import { createSlice } from '@reduxjs/toolkit';

// Retrieve stored session values
const token = localStorage.getItem('aquahome_token');
let user = null;

try {
  const storedUser = localStorage.getItem('aquahome_user');
  if (storedUser) {
    user = JSON.parse(storedUser);
  }
} catch (e) {
  console.error('Failed to parse user session:', e);
}

const initialState = {
  token: token || null,
  user: user || null,
  isAuthenticated: !!token && !!user,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action) {
      const { token, user } = action.payload;
      state.token = token;
      state.user = user;
      state.isAuthenticated = true;
      localStorage.setItem('aquahome_token', token);
      localStorage.setItem('aquahome_user', JSON.stringify(user));
    },
    updateUser(state, action) {
      state.user = action.payload;
      localStorage.setItem('aquahome_user', JSON.stringify(action.payload));
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('aquahome_token');
      localStorage.removeItem('aquahome_user');
    },
  },
});

export const { setCredentials, updateUser, logout } = authSlice.actions;
export default authSlice.reducer;


