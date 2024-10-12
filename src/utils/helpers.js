// import 'firebase/compat/auth'
// import 'firebase/compat/firestore'

import { find, isNil, shuffle } from 'lodash'

import _ from 'lodash'
// import firebase from 'firebase/compat/app'
// import firebase from '../firestore'
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'
import { firestore } from '../firebase' // Adjust the import according to your project structure
import firebase from 'firebase/compat/app'

export const range = (n) => {
  return [...Array(n).keys()]
}

const displaySet = (tuple, rowSize = 3) => {
  let matrix
  if (rowSize === 4) {
    matrix = range(3).map((i) => {
      const row = range(4).map((j) => {
        if (tuple.includes(4 * i + j)) {
          return 'x'
        }
        return 'o'
      })
      return row.join('')
    })
  } else {
    matrix = range(4).map((i) => {
      const row = range(3).map((j) => {
        if (tuple.includes(3 * i + j)) {
          return 'x'
        }
        return 'o'
      })
      return row.join('')
    })
  }
  console.log(matrix.join('\n'))
}

export const serializeGame = (state) => {
  const status = JSON.stringify({
    board: state.board,
    deck: state.deck,
    selected: state.selected,
  })
  return status
}

export const countSets = (board, { debug = false, returnWhenFound = false } = {}) => {
  let count = 0
  let candidate = []
  for (let a = 0; a < board.length - 2; a++) {
    for (let b = a + 1; b < board.length - 1; b++) {
      for (let c = b + 1; c < board.length; c++) {
        candidate = [board[a], board[b], board[c]]
        if (isSet(candidate)) {
          if (debug) {
            displaySet([a, b, c])
          }
          count++
          if (returnWhenFound) {
            return count
          }
        }
      }
    }
  }
  return count
}

export const makeDeck = () => {
  let deck = []
  range(3).forEach((c) => {
    range(3).forEach((n) => {
      range(3).forEach((s) => {
        range(3).forEach((f) => {
          const card = '' + c + s + n + f
          deck.push(card)
        })
      })
    })
  })
  return deck
}

export const isSet = (selected) => {
  if (selected.length !== 3) {
    return false
  }
  const [a, b, c] = selected
  for (let i = 0; i < 4; i++) {
    const sum = Number(a[i]) + Number(b[i]) + Number(c[i])
    if (sum % 3 !== 0) {
      return false
    }
  }
  return true
}

export const nameThird = (a, b) => {
  let features
  let missing
  let result = ''
  for (let i = 0; i < 4; i++) {
    if (a[i] === b[i]) {
      result = result + a[i]
    } else {
      features = Number(a[i]) + Number(b[i])
      missing = (3 - features).toString()
      result = result + missing
    }
  }
  return result.trim()
}

export const cardToggle = (card, selected) => {
  if (selected.includes(card)) {
    return selected.filter((c) => c !== card)
  } else {
    return [...selected, card]
  }
}

export const reshuffle = ({ board = [], deck }, boardSize = 12, minimumSets = 1) => {
  let newDeck = shuffle([...board, ...deck])
  while (
    countSets(newDeck.slice(0, boardSize)) < minimumSets &&
    countSets(newDeck, { returnWhenFound: true }) > 0
  ) {
    newDeck = shuffle(newDeck)
  }
  return {
    deck: newDeck.slice(boardSize),
    board: newDeck.slice(0, boardSize),
  }
}

export const getRandomSet = (common_traits = null) => {
  if (common_traits === null) {
    const deck = _.shuffle(makeDeck())
    let board = [...deck.slice(0, 2)]
    const third = nameThird(board[0], board[1])
    return [board[0], board[1], third]
  }

  const result = ['', '', '']
  let common = [false, false, false, false]
  const common_indices = _.sampleSize(_.range(4), common_traits)
  common_indices.forEach((i) => {
    common[i] = Math.floor(Math.random() * 3).toString()
  })
  common.forEach((c) => {
    const potentialOrder = _.shuffle(['0', '1', '2'])
    for (let j = 0; j < 3; j++) {
      if (c === false) {
        result[j] = result[j] + potentialOrder[j].toString()
      } else {
        result[j] = result[j] + c
      }
    }
  })
  return result
}

/**
 * The first two cards on the board will form a set with some other card
 */

export const getBoardStartingWithSet = ({
  startingSetCards = 2,
  boardSize = 12,
  commonTraits,
} = {}) => {
  let deck = _.shuffle(makeDeck())
  let set = _.shuffle(getRandomSet(commonTraits))
  let board = set.slice(0, 2)
  const third = set[2]
  deck = deck.filter((c) => !set.includes(c))
  let restBoard = _.shuffle([third, ...deck.slice(0, boardSize - 3)])
  board = [...board, ...restBoard]
  deck = deck.slice(boardSize - 3)
  return {
    board,
    deck,
  }
}

export const removeSelected = (state) => {
  const { board, deck, selected } = state
  const newCards = deck.slice(0, 3)
  let newBoard = [...board]
  let newDeck = deck.slice(3)
  selected.forEach((c, i) => {
    let index = newBoard.indexOf(c)
    newBoard[index] = newCards[i]
  })
  while (countSets(newBoard) === 0) {
    ;({ deck: newDeck, board: newBoard } = reshuffle({
      board: newBoard,
      deck: newDeck,
    }))
  }

  return {
    deck: newDeck,
    board: newBoard,
    selected: [],
  }
}

export const handleGoogleSignIn = () => {
  const auth = getAuth()
  signInWithPopup(auth, provider)
    .then((result) => {
      // This gives you a Google Access Token. You can use it to access the Google API.
      const credential = GoogleAuthProvider.credentialFromResult(result)
      const token = credential.accessToken
      // The signed-in user info.
      const user = result.user
      // IdP data available using getAdditionalUserInfo(result)
      // ...
    })
    .catch((error) => {
      // Handle Errors here.
      const errorCode = error.code
      const errorMessage = error.message
      // The email of the user's account used.
      const email = error.customData.email
      // The AuthCredential type that was used.
      const credential = GoogleAuthProvider.credentialFromError(error)
      // ...
    })
}

export const handleGoogleRedirect = () => {
  const provider = new firebase.auth.GoogleAuthProvider()
  // firebase.auth().signInWithRedirect(provider)

  firebase
    .auth()
    .signInWithPopup(provider)
    .then((result) => {
      /** @type {firebase.auth.OAuthCredential} */
      var credential = result.credential

      // This gives you a Google Access Token. You can use it to access the Google API.
      var token = credential.accessToken
      // The signed-in user info.
      var user = result.user
      // IdP data available in result.additionalUserInfo.profile.
      // ...
    })
    .catch((error) => {
      // Handle Errors here.
      var errorCode = error.code
      var errorMessage = error.message
      // The email of the user's account used.
      var email = error.email
      // The firebase.auth.AuthCredential type that was used.
      var credential = error.credential
      // ...
    })
}

export const updateGame = async (id, data) => {
  let reference
  // if id is a string, convert it to a firestore reference
  if (typeof id === 'string') {
    reference = doc(firestore, 'games', id)
  } else {
    reference = id
  }
  try {
    await updateDoc(reference, {
      ...data,
      lastUpdate: firebase.firestore.FieldValue.serverTimestamp(),
    })
  } catch (error) {
    console.error('Error updating document: ', error)
  }
}

export const sendAction = (gameId, action) => {
  const actions = firestore
    .collection('games')
    .doc(gameId)
    .collection('actions')
  actions
    .add({
      ...action,
      created: firebase.firestore.FieldValue.serverTimestamp(),
    })
    .then(function(docRef) {
      if (action.type === 'found') {
        const docId = docRef.id
        console.log('Document written with ID: ', docId)
        const pendingActionId = docId
        return pendingActionId
        // TODO: Trigger message if action isnt processed in reasonable time
      }
    })
}

export const playerNotRegistered = (players, name) => {
  const player = find(players, ['name', name])
  return isNil(player)
}
