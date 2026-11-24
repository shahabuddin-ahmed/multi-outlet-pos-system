import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// The outlet the person is working in (shown in the top bar). Nothing sets it until the outlet feature lands.
interface OutletState {
  current: { id: number; name: string } | null;
}

const initialState: OutletState = { current: null };

const outletSlice = createSlice({
  name: 'outlet',
  initialState,
  reducers: {
    selectOutlet: (state, action: PayloadAction<OutletState['current']>) => {
      state.current = action.payload;
    }
  }
});

export const { selectOutlet } = outletSlice.actions;
export default outletSlice.reducer;
