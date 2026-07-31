import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
const BASE_URL = import.meta.env.VITE_API_URL 
  || (window.location.hostname === 'localhost' 
      ? 'http://localhost:4000/api'
      : 'https://finvault-backend-pf4e.onrender.com/api');

console.log('🔗 API URL:', BASE_URL);

const api = axios.create({ 
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 60000,
});

const initialState: any = { user: null, accessToken: null, isAuthenticated: false, isLoading: false, error: null };
export const loginThunk = createAsyncThunk('auth/login', async (credentials: any, { rejectWithValue }) => {
  try { const { data } = await api.post('/auth/login', credentials); return data; }
  catch (err: any) { return rejectWithValue(err.response?.data?.error || 'Login failed'); }
});
export const registerThunk = createAsyncThunk('auth/register', async (payload: any, { rejectWithValue }) => {
  try { const { data } = await api.post('/auth/register', payload); return data; }
  catch (err: any) { return rejectWithValue(err.response?.data?.error || 'Registration failed'); }
});
export const logoutThunk = createAsyncThunk('auth/logout', async () => { await api.post('/auth/logout'); });
const authSlice = createSlice({
  name: 'auth', initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string>) => { state.accessToken = action.payload; },
    setUser: (state, action: PayloadAction<any>) => { state.user = action.payload; state.isAuthenticated = true; },
    logout: (state) => { state.user = null; state.accessToken = null; state.isAuthenticated = false; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => { 
        state.isLoading = true; 
        state.error = null; 
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        // Save token so it survives page refresh
        sessionStorage.setItem('accessToken', action.payload.accessToken);
        sessionStorage.setItem('user', JSON.stringify(action.payload.user));
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(registerThunk.pending, (state) => { 
        state.isLoading = true; 
        state.error = null; 
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        sessionStorage.setItem('accessToken', action.payload.accessToken);
        sessionStorage.setItem('user', JSON.stringify(action.payload.user));
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null; 
        state.accessToken = null; 
        state.isAuthenticated = false;
        sessionStorage.clear();
      });
  },
});
export const { setToken, setUser, logout, clearError } = authSlice.actions;
export default authSlice.reducer;
