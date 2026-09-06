import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import generatorReducer from './generatorSlice'
import searchReducer from './searchSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    generator: generatorReducer,
    search: searchReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
