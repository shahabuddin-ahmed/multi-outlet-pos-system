import { configureStore } from '@reduxjs/toolkit';
import cartReducer from '@/stores/slices/cart-slice';
import sessionReducer from '@/stores/slices/session-slice';

export const store = configureStore({
  reducer: {
    session: sessionReducer,
    cart: cartReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
