import React from 'react'
import { GoogleAuthProvider, signInWithRedirect } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuthState } from 'react-firebase-hooks/auth'
import { Link } from 'react-router-dom'

const GoogleAccount = () => {
  const [googleUser, loading, error] = useAuthState(auth)
  console.log(googleUser)

  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider()
    signInWithRedirect(auth, provider)
  }

  const signOut = () => {
    auth.signOut()
  }

  return (
    <div className="container mt-3">
      {googleUser ? (
        <div>
          <p>Welcome, {googleUser.displayName}</p>
          <p>
            <Link to="/">Home</Link>
          </p>
          <button className="btn btn-primary" onClick={signOut}>
            Sign Out
          </button>
        </div>
      ) : (
        <button className="btn btn-primary" onClick={signInWithGoogle}>
          Sign In with Google
        </button>
      )}
    </div>
  )
}

export default GoogleAccount
