// Import the functions you need from the SDKs you need
import { Capacitor } from "@capacitor/core";
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAuth, indexedDBLocalPersistence, initializeAuth } from 'firebase/auth'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCU8SySilmmhCxwyu9SPLZaMwYL4ajE2mg",
  authDomain: "jonkerbudget.firebaseapp.com",
  databaseURL: "https://jonkerbudget.firebaseio.com",
  projectId: "jonkerbudget",
  storageBucket: "jonkerbudget.appspot.com",
  messagingSenderId: "12474196481",
  appId: "1:12474196481:web:2ed142459eb56e07b89600"
};

// Initialize Firebase
export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_DB = getFirestore(FIREBASE_APP);
export const FIREBASE_STOREAGE = getStorage(FIREBASE_APP);

export const FIREBASE_AUTH = selectAuth();


function selectAuth() {
    let auth;

    if(Capacitor.isNativePlatform()){
        auth = initializeAuth(FIREBASE_APP, {
            persistence: indexedDBLocalPersistence
        });
    } else {
        auth = getAuth(FIREBASE_APP);
    }

    return auth;
}