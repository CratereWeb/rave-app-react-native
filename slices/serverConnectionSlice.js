import { createSlice } from "@reduxjs/toolkit";

//? Slice du Store dédié aux données du serveur contacté par l'application
//?     - adresse IP
//?     - port
//?     - la connexion application-serveur fonctionne-t-elle ?

const serverConnectionSlice = createSlice({
    name: "serverConnectionSlice",
    initialState: {
        ip: "",
        port: 0,
    },
    reducers: {
        getPort: (state, action) => {
            return state.port;    
        },
        getIP: (state, action) => {
            return state.ip;
        },
        getFullAddress: (state, action) => {
            return state;
        },
        setIP: (state, action) => {
            state.ip = action.payload;
        },
        setPort: (state, action) => {
            state.port = action.payload;
        },
        setFullAddress: (state, action) => {
            state.ip = action.payload.ip;
            state.port = action.payload.port;
        },
        resetState: (state, action) => {
            state = initialState;
        },

    }
});

export const { getPort, getIP, getFullAddress, setIP, setPort, setFullAddress, resetState } = serverConnectionSlice.actions;
export const serverConnectionSliceReducer = serverConnectionSlice.reducer;