import { useState, createContext, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [selectedCareer, setSelectedCareer] = useState(null);
    const [isBotOpen, setIsBotOpen] = useState(false);

    return (
        <AuthContext.Provider value={{ user, setUser, selectedCareer, setSelectedCareer, isBotOpen, setIsBotOpen }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
