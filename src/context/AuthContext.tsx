import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import { Redirect } from "react-router";
import { FIREBASE_AUTH, FIREBASE_DB } from "../config/FirebaseConfig";
import { UserModel } from "../models/UserModel";

interface AuthProps {
    user?: User | null;
    profile?: UserModel | null;
    isAdmin?: boolean;
    initialized?: boolean;
    logout?: () => Promise<void>;
}


export const AuthContext = createContext<AuthProps>({});

export function useAuth() {
    return useContext(AuthContext);
}

export const AuthProvider = ({children}: PropsWithChildren) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserModel | null>(null);
    const [initialized, setinitialized] = useState<boolean>(false);


    useEffect(() => {
        return onAuthStateChanged(FIREBASE_AUTH, (user) => {
            console.log('AUTH CHANTED: ', user);

            setUser(user);
            setinitialized(true);
        });
    }, [])

    useEffect(() => {
        const email = user?.email?.toLowerCase();
        if (!email) {
            setProfile(null);
            return;
        }

        const profileQuery = query(collection(FIREBASE_DB, 'user'), where('email', '==', email));
        return onSnapshot(profileQuery, (snapshot) => {
            const d = snapshot.docs[0];
            setProfile(d ? { ...(d.data() as UserModel), guidId: d.id } : null);
        }, (error) => console.error('Profile fetch failed:', error));
    }, [user?.email])


    const providerValue = {
        user,
        profile,
        isAdmin: profile?.isAdmin === true,
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