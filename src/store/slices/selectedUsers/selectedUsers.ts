import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface User {
  id: string;
  username: string;
  address?: string;
  fullName: string;
  profilePicture?: string;
  status?: string;
  lastActive?: string;
  backgroundColor?: string;
}

interface SelectedUsersState {
  selectedUsers: User[];
}

const initialState: SelectedUsersState = {
  selectedUsers: [],
};

const selectedUsersSlice = createSlice({
  name: 'selectedUsers',
  initialState,
  reducers: {
    addUser: (state, action: PayloadAction<User>) => {
      if (!state.selectedUsers.some(user => user.id === action.payload.id)) {
        state.selectedUsers.push(action.payload);
      }
    },
    removeUser: (state, action: PayloadAction<string>) => {
      state.selectedUsers = state.selectedUsers.filter(
        user => user.id !== action.payload,
      );
    },
    clearUsers: state => {
      state.selectedUsers = [];
    },
  },
});

export const {addUser, removeUser, clearUsers} = selectedUsersSlice.actions;
export const SelectedUsers = selectedUsersSlice.reducer;
export default selectedUsersSlice.reducer;
