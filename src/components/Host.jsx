import React, { useEffect, useRef, useState } from 'react'
import {
  cardToggle,
  handleGoogleRedirect,
  isSet,
  makeDeck,
  removeSelected,
  reshuffle,
  updateGame,
} from '../utils/helpers'
import { findKey, isEmpty } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'

import Board from './Board'
import { Link } from 'react-router-dom'
import PlayerList from './PlayerList'
import Signout from './Signout'
import { colors } from '../config'
import firebase from 'firebase/compat/app'
import { firestore } from '../firebase'
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  deleteDoc,
  doc,
  onSnapshot,
} from 'firebase/firestore'
import { updateNickname } from '../redux/userSlice'
import { produce } from 'immer'

import { auth } from '../firebase'
import { useAuthState } from 'react-firebase-hooks/auth'

const config = {
  turnTime: 5000,
  colors,
  playingTo: 6,
}

function Host() {
  const userReducer = useSelector((state) => state.user)
  const [googleUser, loading, error] = useAuthState(auth)

  const { user } = userReducer
  const dispatch = useDispatch()

  const userLoading = useSelector((state) => state.user.loading)

  const myFire = useRef({})
  const firebaseRefs = myFire.current

  const initialDeck = makeDeck()
  const initialGameState = {
    ...reshuffle({
      deck: initialDeck.slice(12),
      board: initialDeck.slice(0, 12),
    }),
    selected: [],
  }

  const [gameInProgress, setGameInProgress] = useState()
  const [gameTitle, setGameTitle] = useState('')
  const [activeGameUpdater, setActiveGameUpdater] = useState()
  const [gameSubscription, setGameSubscription] = useState()
  const [actionsSubscription, setActionSubscription] = useState()

  const [state, setFullState] = useState({
    gameTitle: '',
    players: {},
    created: false,
    gameStarted: false,
    myName: '',
    setFound: false,
    declarer: null,
    gameOver: '',
    ...initialGameState,
  })

  const currentState = useRef(state)
  currentState.current = state

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const q = query(collection(firestore, 'games'), where('creator_uid', '==', googleUser.uid))
        const querySnapshot = await getDocs(q)
        querySnapshot.forEach((doc) => {
          console.log(doc.id)
          const oldGame = {
            ...doc.data(),
            gameTitle: doc.id,
          }
          console.log('Old game: ', oldGame)
          setGameInProgress(oldGame)
        })
      } catch (error) {
        console.log('Error getting documents: ', error)
      }
    }

    if (googleUser && !isEmpty(googleUser.uid)) {
      fetchGames()
    }
  }, [googleUser])

  useEffect(() => {
    return function() {
      window.clearInterval(activeGameUpdater)
    }
  }, [activeGameUpdater])

  const setState = (update) => {
    setFullState({
      ...currentState.current,
      ...update,
    })
  }

  const handleRejectResume = async () => {
    console.log('game in progress', gameInProgress)

    // Delete the document
    try {
      await deleteDoc(doc(firestore, 'games', gameInProgress.gameTitle))
      console.log(`Document with ID ${gameInProgress.gameTitle} deleted successfully.`)
      setGameInProgress(null)
    } catch (deleteError) {
      console.error('Error deleting document: ', deleteError)
    }
    return
  }

  const handleCardClick = (card) => {
    const { myName } = state
    if (!state.declarer) {
      const newSelected = cardToggle(card, state.selected)
      if (isSet(newSelected)) {
        updateSelected(newSelected, myName)
      }
      setState({
        selected: newSelected,
      })
    }
  }

  const handleRedeal = () => {
    const newState = reshuffle(state)
    setAndSendState(newState)
  }

  const actionsSubscribe = (reference) => {
    // reference is a doc, I want the collection called 'actions' located on that doc
    const actions = collection(reference, 'actions')

    // let doc
    // if (typeof reference === 'string') {
    //   doc = doc(firestore, 'games').doc(reference)
    // } else {
    //   doc = reference
    // }
    // const actions = doc.collection('actions')
    onSnapshot(actions, (snapshot) => {
      console.log('got action snapshot')
      console.log('snap', snapshot)
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const action = change.doc.data()
          console.log(action)
          processAction(action)

          // delete the action doc
          deleteDoc(change.doc.ref)
        }
        if (change.type === 'removed') {
          console.log('Removed action: ', change.doc.data())
        }
      })
    })
    return actions
  }

  const subscribeToGame = async (gameId) => {
    firebaseRefs.game = doc(firestore, 'games', gameId)

    const gameUpdateId = window.setInterval(() => {
      updateGame(gameId, {})
    }, 30000)

    setActiveGameUpdater(gameUpdateId)

    const unsubscribe = actionsSubscribe(firebaseRefs.game)
    setActionSubscription(unsubscribe)
  }

  const reloadGame = () => {
    const hostName = findKey(gameInProgress.players, (player) => player.host)

    const { gameTitle } = gameInProgress
    setState({ gameTitle })
    subscribeToGame(gameTitle)

    setState({
      myName: hostName,
      created: true,
      ...gameInProgress,
      lastUpdate: firebase.firestore.FieldValue.serverTimestamp(),
    })
  }

  const handleCreateGame = async (e) => {
    e.preventDefault()
    const { myName, board, deck, selected, players, gameOver } = state

    console.log('players', players)
    const officialTitle = !isEmpty(gameTitle) ? gameTitle : `${myName}'s game`
    setState({ gameTitle: officialTitle })

    try {
      const docRef = await addDoc(collection(firestore, 'games'), {
        title: gameTitle, // Include the gameTitle variable here
        creator_uid: googleUser.uid,
        players,
        board,
        deck,
        selected,
        gameOver,
        lastUpdate: firebase.firestore.FieldValue.serverTimestamp(),
      })
      firebaseRefs.game = docRef
    } catch (error) {
      console.error('Error adding document: ', error)
    }

    const updateId = window.setInterval(() => {
      // use new syntax
      updateGame(firebaseRefs.game, {})
    }, 30000)
    // @ts-ignore

    setActiveGameUpdater(updateId)

    firebaseRefs.actions = actionsSubscribe(docRef)

    console.log(firebaseRefs.actions)

    // const unsubscribe = actionsSubscribe(officialTitle)
    // setActionSubscription(unsubscribe)

    setState({
      created: true,
    })
  }

  const handleSetName = (e) => {
    e.preventDefault()
    console.log('uid', googleUser.uid)
    setState({
      myName: user.nickname,
      players: {
        [user.nickname]: {
          host: true,
          uid: googleUser.uid,
          score: 0,
          color: config.colors[0],
          position: 0,
        },
      },
    })
  }

  const markPointForDeclarer = (declarer) => {
    if (!declarer) {
      return {}
    }
    const { players } = currentState.current
    const newScore = players[declarer].score + 1
    const newPlayers = produce(players, (draft) => {
      draft[declarer].score = newScore
    })

    const gameOver = newScore >= config.playingTo ? declarer : ''
    if (gameOver) {
      window.setTimeout(() => {
        // firebaseRefs.game.delete()
        // use new syntax
        deleteDoc(firebaseRefs.game)

        clearInterval(activeGameUpdater)
      }, 3000)
    }

    return {
      players: newPlayers,
      gameOver,
    }
  }

  const processAction = (action) => {
    const { type, payload } = action
    const { players, declarer, board } = currentState.current

    const highestPlayerPosition = Math.max(
      ...Object.values(players).map((player) => player.position),
    )

    switch (type) {
      case 'join':
        if (Object.keys(players).includes(payload.name)) {
          return
        }
        const newPlayers = {
          ...players,
          [payload.name]: {
            host: false,
            uid: payload.uid,
            score: 0,
            color: config.colors[Object.keys(players).length],
            position: highestPlayerPosition + 1,
          },
        }
        setAndSendState({ players: newPlayers })
        break
      case 'found':
        if (!declarer && verifySelectedOnBoard(board, payload.selected)) {
          updateSelected(payload.selected, payload.name)
        }
        break
      default:
        return
    }
  }

  const removeSet = (selected, declarer) => {
    if (isSet(selected)) {
      const newScores = markPointForDeclarer(declarer)
      const newState = {
        ...currentState.current,
        setFound: false,
        declarer: null,
        ...newScores,
        ...removeSelected(currentState.current),
      }
      setAndSendState(newState)
    }
  }

  const setAndSendState = (update) => {
    console.log('updating', currentState.current.gameTitle)
    setState(update)
    updateGame(firebaseRefs.game, update)
  }

  const verifySelectedOnBoard = (board, selected) => {
    for (let i = 0; i < selected.length; i++) {
      if (!board.includes(selected[i])) {
        return false
      }
    }
    return true
  }

  const updateSelected = (newSelected, declarer) => {
    const newState = {
      setFound: isSet(newSelected),
      selected: newSelected,
      declarer,
    }
    setAndSendState(newState)
    if (newState.setFound) {
      setTimeout(() => {
        removeSet(newSelected, declarer)
      }, 4000)
    }
  }

  const { board, deck, selected, declarer, players, created, gameStarted, myName } = state

  if (userLoading) {
    return 'Loading...'
  }

  if (!googleUser) {
    return (
      <div className="container mt-4">
        <p>To host a game, sign in with your Google account.</p>
        <p>
          <button onClick={handleGoogleRedirect} className="btn btn-info">
            Sign in
          </button>
        </p>
      </div>
    )
  }

  if (gameInProgress && !state.created) {
    return (
      <div className="container">
        <p>You are already hosting a game. Return to it?</p>
        <button className="btn btn-primary mr-5" onClick={() => reloadGame()}>
          YES!
        </button>
        <button className="btn btn-danger" onClick={handleRejectResume}>
          No, remove it
        </button>
      </div>
    )
  }

  if (myName === '') {
    return (
      <div className="container">
        <Signout />
        <h4>Enter your nickname:</h4>
        <form onSubmit={handleSetName}>
          <div className="row mb-4">
            <div className="col-md-3 mb-3 mr-md-4">
              <input
                autoFocus
                placeholder="hostname"
                value={user.nickname}
                onChange={(e) => {
                  dispatch(updateNickname(e.target.value))
                  window.localStorage.setItem('nickname', e.target.value)
                }}
              />
            </div>
            <div className="col-md-3">
              <button type="submit" className="btn btn-primary">
                Submit
              </button>
            </div>
          </div>
        </form>
        <div>
          <p>
            <Link to="/">Main Menu</Link>
          </p>
        </div>
      </div>
    )
  }

  if (!created) {
    return (
      <div className="container mt-4">
        <h4>Name your game:</h4>
        <form onSubmit={handleCreateGame}>
          <div className="mb-3">
            <input
              autoFocus
              placeholder={`${myName}'s game`}
              onChange={(e) => {
                setGameTitle(e.target.value)
              }}
              value={gameTitle}
            />
          </div>
          <div>
            <button type="submit" className="btn btn-primary">
              Create
            </button>
          </div>
        </form>
      </div>
    )
  }

  if (!gameStarted) {
    return <PlayerList isHost={true} players={players} setState={setAndSendState} />
  }

  return (
    <Board
      board={board}
      deck={deck}
      selected={selected}
      declarer={declarer}
      handleCardClick={handleCardClick}
      // handleDeclare={this.handleDeclare}
      handleRedeal={handleRedeal}
      players={players}
      setFound={state.setFound}
      gameOver={state.gameOver}
      myName={state.myName}
      gameMode="versus"
    />
  )
}

export default Host
