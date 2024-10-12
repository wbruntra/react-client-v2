import React, { Component, Fragment, useState, useEffect, useRef } from 'react'
import { firestore } from '../firebase'
import {
  collection,
  onSnapshot,
  getDocs,
  addDoc,
  query,
  where,
  deleteDoc,
  doc,
} from 'firebase/firestore'

import { Link } from 'react-router-dom'

const styles = {}

function Lobby() {
  const [games, setGames] = useState([])
  const [init, setInit] = useState(false)

  useEffect(() => {
    const gamesRef = collection(firestore, 'games')

    const unsubscribe = onSnapshot(gamesRef, (snapshot) => {
      const newGames = []
      snapshot.forEach((doc) => {
        newGames.push({
          name: doc.id,
          ...doc.data(),
        })
      })
      setGames(newGames)
      setInit(true)
    })

    // Cleanup the subscription on component unmount
    return () => unsubscribe()
  }, [])

  console.log(games)

  if (!init) {
    return null
  }
  const activeGames = games.filter((g) => {
    const { lastUpdate } = g
    if (!lastUpdate) {
      return false
    }
    const updated = lastUpdate.toMillis()
    const now = new Date().getTime()
    const age = Math.round((now - updated) / 1000)
    return age < 40
  })

  return (
    <div className="container" style={{ height: '100vh' }}>
      {activeGames.length === 0 ? (
        <Fragment>
          <div className="row">
            <div className="col-8 col-md-6">
              <div className="card-panel teal" style={{ marginTop: window.innerHeight * 0.2 }}>
                <span className="white-text">There are currently no active games.</span>
              </div>
              <p>
                Click <Link to="/host">here</Link> to host one
              </p>
              <p>
                <Link className="btn btn-primary" to="/">
                  Back
                </Link>
              </p>
            </div>
          </div>
        </Fragment>
      ) : (
        <Fragment>
          <h4 className="text-center my-4">Available games</h4>
          <div className="row align-content-center">
            {activeGames.map((game, i) => {
              return (
                <div className="col-6 col-md-4" key={game.name}>
                  <div className="card available-game">
                    <div className="my-auto text-center">
                      <Link to={`/guest/${game.name}`}>{game.name}</Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="row">
            <div className="col mt-4">
              <Link className="btn btn-primary" to="/">
                Back
              </Link>
            </div>
          </div>
        </Fragment>
      )}
    </div>
  )
}

export default Lobby
