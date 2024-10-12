import * as React from 'react'
import Board from './Board'
import { makeDeck, cardToggle, reshuffle, removeSelected, isSet } from '../utils/helpers'
import update from 'immutability-helper'
import firebase from 'firebase/app'
import 'firebase/firestore'
import firestore from '../firestore'
import { colors } from '../config'

const config = {
  turnTime: 5000,
  colors,
  playingTo: 6,
}

class Player extends React.Component {
  constructor() {
    super(props)
    const initialDeck = makeDeck()
    const initialGameState = {
      ...reshuffle({
        deck: initialDeck.slice(12),
        board: initialDeck.slice(0, 12),
      }),
      selected: [],
    }
    this.nameInputRef = React.createRef()

    this.state = {
      players: {},
      gameTitle: '',
      created: false,
      myName: '',
      inputName: '',
      setFound: false,
      autoplay: false,
      declarer: null,
      gameOver: false,
      ...initialGameState,
    }
  }

  componentDidMount = () => {
    this.nameInputRef.current.focus()
  }

  handlePlayerName = (e) => {
    console.log(e.currentTarget)
    e.preventDefault()
    const { inputName } = this.state
    this.setState({
      myName: inputName,
      players: {
        [inputName]: {
          score: 0,
          color: config.colors[0],
        },
      },
    })
  }

  triggerFoundSequence = (selected, name) => {}

  updateSelected = (newSelected, declarer) => {
    const newState = {
      setFound: isSet(newSelected),
      selected: newSelected,
      declarer,
    }
    if (newState.setFound) {
      setTimeout(() => {
        this.removeSet()
      }, 2000)
    }
    this.setAndSendState(newState)
  }

  handleCardClick = (card) => {
    const { myName } = this.state
    if (!this.state.declarer) {
      const newSelected = cardToggle(card, this.state.selected)
      if (isSet(newSelected)) {
        this.updateSelected(newSelected, myName)
      }
      this.setState({
        selected: newSelected,
      })
    }
  }

  handleRedeal = () => {
    const newState = reshuffle(this.state)
    this.setAndSendState(newState)
  }

  removeSet = () => {
    const { declarer, selected } = this.state
    if (isSet(selected)) {
      const newScores = this.markPointForDeclarer(declarer)
      const newState = {
        setFound: false,
        declarer: null,
        timeDeclared: null,
        ...newScores,
        ...removeSelected(this.state),
      }
      this.setAndSendState(newState)
    }
  }

  render() {
    const {
      board,
      deck,
      selected,
      declarer,
      players,
      gameTitle,
      created,
      myName,
      inputName,
    } = this.state
    if (myName === '') {
      return (
        <div className="container">
          <h4>Enter your name:</h4>
          <form onSubmit={this.handlePlayerName}>
            <input
              ref={this.nameInputRef}
              placeholder="hostname"
              value={inputName}
              onChange={(e) => {
                this.setState({ inputName: e.target.value })
              }}
            />
            <button type="submit" className="btn">
              Send
            </button>
          </form>
        </div>
      )
    }
    if (!created) {
      return (
        <div className="container">
          <h4>Name your game:</h4>
          <form onSubmit={this.handleCreateGame}>
            <input
              onChange={(e) => {
                this.setState({ gameTitle: e.target.value })
              }}
              value={gameTitle}
            />
            <button type="submit" className="btn">
              Create
            </button>
          </form>
        </div>
      )
    }
    return (
      <Board
        board={board}
        deck={deck}
        selected={selected}
        declarer={declarer}
        handleCardClick={this.handleCardClick}
        // handleDeclare={this.handleDeclare}
        handleRedeal={this.handleRedeal}
        players={players}
        setFound={this.state.setFound}
        gameOver={this.state.gameOver}
        myName={this.state.myName}
      />
    )
  }
}

export default Player
