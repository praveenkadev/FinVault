const fs = require('fs');
fs.mkdirSync('src/store/slices', { recursive: true });

fs.writeFileSync('src/store/index.ts',
`import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import transactionsReducer from './slices/transactionsSlice';
export const store = configureStore({ reducer: { auth: authReducer, transactions: transactionsReducer } });
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
`);

fs.writeFileSync('src/store/slices/authSlice.ts',
`import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
const api = axios.create({ baseURL: '/api', withCredentials: true });
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
      .addCase(loginThunk.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(loginThunk.fulfilled, (state, action) => { state.isLoading = false; state.user = action.payload.user; state.accessToken = action.payload.accessToken; state.isAuthenticated = true; })
      .addCase(loginThunk.rejected, (state, action) => { state.isLoading = false; state.error = action.payload as string; })
      .addCase(registerThunk.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(registerThunk.fulfilled, (state, action) => { state.isLoading = false; state.user = action.payload.user; state.accessToken = action.payload.accessToken; state.isAuthenticated = true; })
      .addCase(registerThunk.rejected, (state, action) => { state.isLoading = false; state.error = action.payload as string; })
      .addCase(logoutThunk.fulfilled, (state) => { state.user = null; state.accessToken = null; state.isAuthenticated = false; });
  },
});
export const { setToken, setUser, logout, clearError } = authSlice.actions;
export default authSlice.reducer;
`);

fs.writeFileSync('src/store/slices/transactionsSlice.ts',
`import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
const api = axios.create({ baseURL: '/api', withCredentials: true });
const initialState: any = { items: [], pagination: null, isLoading: false, error: null };
export const fetchTransactions = createAsyncThunk('transactions/fetchAll', async (params: any = {}) => {
  const token = sessionStorage.getItem('accessToken');
  const { data } = await api.get('/transactions', { params, headers: token ? { Authorization: 'Bearer ' + token } : {} });
  return data;
});
export const createTransaction = createAsyncThunk('transactions/create', async (payload: any, { rejectWithValue }) => {
  try {
    const token = sessionStorage.getItem('accessToken');
    const { data } = await api.post('/transactions', payload, { headers: token ? { Authorization: 'Bearer ' + token } : {} });
    return data.data;
  } catch (err: any) { return rejectWithValue(err.response?.data?.error || 'Failed'); }
});
const transactionsSlice = createSlice({
  name: 'transactions', initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => { state.isLoading = true; })
      .addCase(fetchTransactions.fulfilled, (state, action) => { state.isLoading = false; state.items = action.payload.data; state.pagination = action.payload.pagination; })
      .addCase(fetchTransactions.rejected, (state, action) => { state.isLoading = false; state.error = action.error.message || 'Failed'; })
      .addCase(createTransaction.fulfilled, (state, action) => { if (action.payload) state.items.unshift(action.payload); });
  },
});
export default transactionsSlice.reducer;
`);

console.log('✅ All store files created successfully!');