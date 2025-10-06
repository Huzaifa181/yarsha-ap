import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AvailableBiometricsState {
  availableBiometrics: string[];
  isBiometricEnrolled: boolean;
  isBiometricEnabled: boolean;
}

const initialState: AvailableBiometricsState = {
  availableBiometrics: [],
  isBiometricEnrolled: false,
  isBiometricEnabled: false,
};

const availableBiometricsSlice = createSlice({
  name: "availableBiometrics",
  initialState,
  reducers: {
    setAvailableBiometrics(state, action: PayloadAction<string[]>) {
      state.availableBiometrics = action.payload;
    },
    setIsBiometricEnrolled(state, action: PayloadAction<boolean>) {
      state.isBiometricEnrolled = action.payload;
    },
    setIsBiometricEnabledInState(state, action: PayloadAction<boolean>) {
      state.isBiometricEnabled = action.payload;
    },
  },
});

export const { setAvailableBiometrics, setIsBiometricEnrolled, setIsBiometricEnabledInState } =
  availableBiometricsSlice.actions;
export default availableBiometricsSlice.reducer;
export const AvailableBiometricsReducer = availableBiometricsSlice.reducer;
