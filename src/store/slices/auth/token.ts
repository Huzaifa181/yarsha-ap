import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface TokenState {
  authToken: string;
}

const initialState: TokenState = {
  authToken: '',
};

const accessTokenSlice = createSlice({
  name: 'accessToken',
  initialState,
  reducers: {
    setAuthToken(state, action: PayloadAction<string>) {
      state.authToken = action.payload;
    },
    clearAuthToken(state) {
      state.authToken = '';
    },
  },
});

export const {setAuthToken, clearAuthToken} = accessTokenSlice.actions;
export default accessTokenSlice.reducer;
export const AccessTokenReducer = accessTokenSlice.reducer;

