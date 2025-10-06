import {createSlice, PayloadAction} from '@reduxjs/toolkit';

type LogoutState = {
  logoutType: string | null;
};

const initialState: LogoutState = {
  logoutType: null,
};

const logoutSlice = createSlice({
  name: 'logout',
  initialState,
  reducers: {
    setLogoutType(state, action: PayloadAction<string>) {
      state.logoutType = action.payload;
    },
    clearLogoutType(state) {
      state.logoutType = null;
    },
  },
});

export const {setLogoutType, clearLogoutType} = logoutSlice.actions;
export default logoutSlice.reducer;
export const LogoutReducer = logoutSlice.reducer;
