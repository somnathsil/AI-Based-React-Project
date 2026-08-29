import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import generatorReducer from './generatorSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    generator: generatorReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
