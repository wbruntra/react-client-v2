// import 'firebase/compat/auth'
// import 'firebase/compat/firestore'

// import { initializeApp } from 'firebase/app'
// import { getAuth } from 'firebase/auth'

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

import firebaseConfig from './firebaseConfig'

// import firebase from 'firebase/compat/app'

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

export default app

// const firestore = firebase.firestore()

// export default firestore
