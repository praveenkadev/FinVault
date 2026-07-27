import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState: any = { 
  items: [], 
  pagination: null, 
  isLoading: false, 
  error: null 
};

// Helper to get token from Redux state
const getToken = (getState: () => any): string => {
  return getState().auth.accessToken || '';
};

export const fetchTransactions = createAsyncThunk(
  'transactions/fetchAll',
  async (params: any = {}, { getState }) => {
    const token = getToken(getState as () => any);
    console.log('Fetching transactions with token:', token ? 'EXISTS' : 'MISSING');
    const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'https://finvault-backend-pf4e.onrender.com/api/transactions', {      
      params,
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    });
    console.log(data);
    return data;
  }
);

export const createTransaction = createAsyncThunk(
  'transactions/create',
  async (payload: any, { getState, rejectWithValue }) => {
    try {
      const token = getToken(getState as () => any);
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/transactions`,
        payload, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed');
    }
  }
);

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => { 
        state.isLoading = true; 
        state.error = null; 
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.data || [];
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed';
        console.error('Transaction fetch failed:', action.error);
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        if (action.payload) state.items.unshift(action.payload);
      });
  },
});

export default transactionsSlice.reducer;