import { combineReducers } from '@reduxjs/toolkit';

/**
 * Root Reducer placeholder.
 * Feature slices (authSlice, aiSlice, settingsSlice) will be added here as the application scales.
 */
export const rootReducer = combineReducers({
  // Initial empty reducer mapping until slices are created
  _placeholder: (state = { initialized: true }) => state,
});

export type RootState = ReturnType<typeof rootReducer>;
