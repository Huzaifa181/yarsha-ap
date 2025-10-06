import { createSlice, PayloadAction } from "@reduxjs/toolkit";
interface CountryCodeState {
  countryCode: any;
}
const initialState: CountryCodeState = {
  countryCode: "US",
};
const countryCodeSlice = createSlice({
  name: "countryCode",
  initialState,
  reducers: {
    setCountryCode(state, action: PayloadAction<string>) {
      state.countryCode = action.payload;
    },
  },
});
export const { setCountryCode } = countryCodeSlice.actions;
export default countryCodeSlice.reducer;
export const CountryCodeReducer = countryCodeSlice.reducer;