import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

const DEMO_USER: User = {
  id: '1',
  email: 'admin@mailinator.com',
  name: 'Pixel User',
}

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem('pc_user') || 'null'),
  isAuthenticated: JSON.parse(localStorage.getItem('pc_user') || 'null') !== null,
  isLoading: false,
  error: null,
}

export const login = createAsyncThunk<
  User,
  { email: string; password: string; remember: boolean },
  { rejectValue: string }
>('auth/login', async ({ email, password, remember }, { rejectWithValue }) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  if (email === 'admin@mailinator.com' && password === '123456') {
    if (remember) {
      localStorage.setItem('pc_user', JSON.stringify(DEMO_USER))
    }
    return DEMO_USER
  }

  return rejectWithValue('Invalid email or password')
})

export const logout = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('pc_user')
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload || 'Login failed'
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.isAuthenticated = false
      })
  },
})

export const { clearError } = authSlice.actions
export default authSlice.reducer
