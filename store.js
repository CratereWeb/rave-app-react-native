import { combineReducers, configureStore } from '@reduxjs/toolkit';

import { audioRecordSliceReducer } from './slices/audioRecordSlice';
import { serverConnectionSliceReducer } from './slices/serverConnectionSlice';


const reducers = combineReducers({
    audioRecord: audioRecordSliceReducer,
    serverConnection: serverConnectionSliceReducer,
});

export const store = configureStore({
    reducer: reducers,
});