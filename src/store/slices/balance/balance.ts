import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface SolanaBalanceState {
  balance: number | null;
}

const initialState: SolanaBalanceState = {
  balance: null,
};

const solanaBalanceSlice = createSlice({
  name: 'solanaBalance',
  initialState,
  reducers: {
    setSolanaBalance: (state, action: PayloadAction<number | null>) => {
        console.log("🚀 ~ file: balance.ts ~ line 70 ~ setSolanaBalance: ~ action", action)
      state.balance = action.payload;
    },
    clearSolanaBalance: state => {
      state.balance = null;
    }
  },
});

export const {setSolanaBalance, clearSolanaBalance} = solanaBalanceSlice.actions;
export default solanaBalanceSlice.reducer;
export const BalanceReducer = solanaBalanceSlice.reducer;
