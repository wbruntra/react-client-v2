import { createSlice } from '@reduxjs/toolkit'

export const defaultUser = {
  loading: false,
  user: {
    signedIn: false,
    nickname: localStorage.getItem('nickname') || '',
  },
}

const initialState = {
  ...defaultUser,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updateUser: (state, action) => {
      return {
        ...state,
        ...action.payload,
      }
    },
    updateNickname: (state, action) => {
      state.user.nickname = action.payload
    },
    logOut: (state) => {
      return { loading: false, user: null }
    },
  },
})

export const { updateUser, updateNickname, logOut } = userSlice.actions
export default userSlice.reducer
