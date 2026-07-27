import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import transactionsReducer from './slices/transactionsSlice';

const savedToken = sessionStorage.getItem('accessToken');
const savedUser = sessionStorage.getItem('user');

export const store = configureStore({
  reducer: {
    auth: authReducer,
    transactions: transactionsReducer,
  },
  preloadedState: {
    auth: {
      accessToken: savedToken || null,
      user: savedUser ? JSON.parse(savedUser) : null,
      isAuthenticated: !!savedToken,
      isLoading: false,
      error: null,
    }
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;