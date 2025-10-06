import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface AccountState {
  accountDeleted: boolean;
}

const initialState: AccountState = {
  accountDeleted: false,
};

const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    setAccountDeleted(state, action: PayloadAction<boolean>) {
      state.accountDeleted = action.payload;
    },
    resetAccountState() {
      return initialState;
    },
  },
});

export const {setAccountDeleted, resetAccountState} = accountSlice.actions;
export default accountSlice.reducer;
export const selectAccountDeleted = (state: {account: AccountState}) =>
  state.account.accountDeleted;
export const selectAccountState = (state: {account: AccountState}) =>
  state.account;
export const DeleteAccountReducer = accountSlice.reducer;
