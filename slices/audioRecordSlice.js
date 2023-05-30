import { createSlice } from "@reduxjs/toolkit";

//? Slice du Store dédié à l'enregistrement audio
//?     - chemin vers le répertoire du système de fichiers Expo où est sauvegardé l'enregistrement


const audioRecordSlice = createSlice({
    name: "audioRecordSlice",
    initialState: {
        filepath: "",
        duration: 0,
    },
    reducers: {
        getFilePath: (state, action) => {
            return state.filepath;
        },
        getDuration: (state, action) => {
            return state.duration;
        },
        setFilePath: (state, action) => {
            state.filepath = action.payload;
        },
        setDuration: (state, action) => {
            state.duration = action.payload
        },
        resetState: (state, action) => {
            state = initialState;
        },
    }
});

export const { getFilePath, getDuration, setFilePath, setDuration, resetState } = audioRecordSlice.actions;
export const audioRecordSliceReducer = audioRecordSlice.reducer;