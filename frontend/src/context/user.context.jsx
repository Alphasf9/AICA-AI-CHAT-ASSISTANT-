/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { createContext, useState, useContext } from 'react';


export const UserContext = createContext();


export const UserProvider = ({ children }) => {
    const [ user, setUser ] = useState(null);

    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
};