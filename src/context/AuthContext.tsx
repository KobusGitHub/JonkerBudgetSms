import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import { Redirect } from "react-router";
import { FIREBASE_AUTH } from "../config/FirebaseConfig";

interface AuthProps {
    user?: User | null;
    initialized?: boolean;
    logout?: () => Promise<void>;
}


export const AuthContext = createContext<AuthProps>({});

export function useAuth() {
    return useContext(AuthContext);
}

export const AuthProvider = ({children}: PropsWithChildren) => {
    const [user, setUser] = useState<User | null>(null);
    const [initialized, setinitialized] = useState<boolean>(false);


    useEffect(() => {
        onAuthStateChanged(FIREBASE_AUTH, (user) => {
            console.log('AUTH CHANTED: ', user);

            setUser(user);
            setinitialized(true);
        }) 
    }, [])


    const providerValue = {
        user,
        initialized,
        logout: () => signOut(FIREBASE_AUTH)
    }

    return <AuthContext.Provider value={providerValue}>{children}</AuthContext.Provider>
}


export const AuthenticatedRoute = ({children}: any) => {
    const { user, initialized } = useAuth();

    if(!initialized) {
        return;
    }


    return user ? children : <Redirect to='/' />
}