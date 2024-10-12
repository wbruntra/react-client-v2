import 'firebase/compat/auth'
import 'firebase/compat/firestore'

import React, { useEffect, useState } from 'react'
import { updateNickname, updateUser } from '../redux-helpers'

import axios from 'axios'
import firebase from 'firebase/compat/app'
import { useDispatch } from 'react-redux'

function App(props) {
  const [user, setUser] = useState(null)
  const dispatch = useDispatch()

  useEffect(() => {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        const nickname = window.localStorage.getItem('nickname') || user.displayName.split(' ')[0]
        const myUser = {
          displayName: user.displayName,
          email: user.email,
          emailVerified: user.emailVerified,
          photoURL: user.photoURL,
          isAnonymous: user.isAnonymous,
          uid: user.uid,
          providerData: user.providerData,
          nickname,
        }
        dispatch(updateUser({ loading: false, user: myUser }))
        axios
          .get(`/api/user/${user.uid}`)
          .then((result) => {
            console.log('User is registered')
          })
          .catch((err) => {
            if (err.response && err.response.status === 404) {
              console.log('User not registered')
              axios
                .post('/api/user', {
                  uid: user.uid,
                  info: myUser,
                })
                .then(() => {
                  console.log('User registered successfully')
                })
                .catch((err) => {
                  console.log('Error registering user', err)
                })
            } else {
              console.log('An error occurred trying to GET user info')
            }
          })
      } else {
        console.log('Not signed in')
        dispatch(updateUser({ loading: false, user: null }))
      }
    })
  }, [])

  return 'OK'
}

export default App
