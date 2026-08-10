import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from './rootReducer';

/**
 * Redux Toolkit Store Configuration
 * Configures global state management with standard middleware & dev tools enablement.
 */
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  devTools: import.meta.env.DEV,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
