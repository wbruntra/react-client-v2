import React, { Component, Fragment } from 'react'
import {
  cardToggle,
  countSets,
  handleGoogleRedirect,
  isSet,
  makeDeck,
  nameThird,
  removeSelected as removeSelectedCards,
  reshuffle,
} from '../utils/helpers'
import { cloneDeep, isEqual, shuffle } from 'lodash'

import Board from './Board'
import { Link } from 'react-router-dom'
// import Slider from 'react-rangeslider'
import Modal from './Modal'
import Signout from './Signout'
import axios from 'axios'
import { colors } from '../config'
import { connect } from 'react-redux'
import { produce } from 'immer'

const debugging = false

const config = {
  turnTime: 4000,
  colors,
  playingTo: 6,
  cpuDelay: 1200,
}

const createGameState = (cardsOnBoard) => {
  const getMinSets = (cardsOnBoard) => {
    return Math.round((cardsOnBoard - 3) / 3)
  }

  const minSets = getMinSets(cardsOnBoard)
  const initialDeck = makeDeck()
  return {
    ...reshuffle(
      {
        deck: initialDeck,
      },
      { boardSize: cardsOnBoard, minimumSets: minSets },
    ),
    selected: [],
  }
}

const logTime = (msg = '') => {
  const d = new Date()
  const s = (d.getTime() % 10 ** 6) / 1000
  console.log(msg, s.toFixed(1))
}

const initialState = {
  players: {
    you: {
      score: 0,
      color: config.colors[0],
    },
  },
  gameStarted: false,
  name: 'you',
  setFound: false,
  gameOver: false,
  startTime: null,
  elapsedTime: null,
  setsFound: [],
  setsOnBoard: null,
  cardsOnBoard: 12,
  popupVisible: false,
  popUpText: 'SET!',
}

const sortSet = (set) => {
  return set.sort()
}

class Puzzle extends Component {
  constructor(props) {
    super(props)
    this.state = {
      ...cloneDeep(initialState),
    }
  }

  handleStartGame = (e) => {
    e.preventDefault()
    const { cardsOnBoard } = this.state
    const gameState = createGameState(cardsOnBoard)
    const startTime = new Date()
    this.setState({
      gameStarted: true,
      startTime,
      elapsedTime: 0,
      ...gameState,
      setsOnBoard: countSets(gameState.board),
    })
    window.timeId = setInterval(() => {
      const elapsedTime = Math.round((new Date().getTime() - startTime.getTime()) / 1000)
      this.setState({
        elapsedTime,
      })
    }, 1000)
  }

  componentDidMount = () => {}

  updatePlayerScore = (name, delta) => {
    const { players } = this.state
    const newScore = players[name].score + delta
    // const newPlayers = update(players, {
    //   [name]: {
    //     $merge: {
    //       score: newScore,
    //     },
    //   },
    // })
    // use immer instead
    const newPlayers = produce(players, (draft) => {
      draft[name].score += delta
    })

    return [newPlayers, newScore]
  }

  performDeclare = (declarer) => {
    if (!this.state.declarer) {
      const timeNow = new Date().getTime()
      const update = {
        declarer,
        timeDeclared: timeNow,
      }
      this.setState(update)

      this.undeclareID = setTimeout(() => {
        this.expireDeclare()
      }, config.turnTime)
    }
  }

  updateSelected = (newSelected, declarer) => {
    const newState = {
      setFound: isSet(newSelected),
      selected: newSelected,
      declarer,
    }
    if (newState.setFound) {
      clearTimeout(this.undeclareID)
      setTimeout(() => {
        this.removeSet()
      }, 2000)
    }
    this.setState(newState)
  }

  handleDeclare = () => {
    return
  }

  resetLocalSelected = (noCheck = false) => {
    this.setState((currentState) => {
      if (currentState.selected.length === 3) {
        if (noCheck || !isSet(currentState.selected)) {
          return {
            selected: [],
          }
        }
      }
    })
  }

  handleCardClick = (card) => {
    const newSelected = cardToggle(card, this.state.selected)
    const newState = {}
    if (newSelected.length === 3) {
      if (isSet(newSelected)) {
        console.log('Set found')
        this.setState((currentState) => {
          window.setTimeout(() => {
            this.setState({
              popupVisible: false,
            })
            this.resetLocalSelected(true)
          }, 2000)
          const { setsFound } = currentState
          const isNewSet = setsFound
            .map((set) => {
              const result = isEqual(newSelected.sort(), set)
              return !result
            })
            .every((result) => result)
          if (!isNewSet) {
            return {
              popupVisible: true,
              popUpText: 'Already found!',
            }
          }
          const newSetsFound = [...setsFound, newSelected.sort()]
          return {
            setsFound: newSetsFound,
            popupVisible: true,
            popUpText: 'SET!',
          }
        })
      } else {
        console.log('Bad set selected!')
        window.setTimeout(this.resetLocalSelected, 1200)
      }
    }

    this.setState({
      ...newState,
      selected: newSelected,
    })
  }

  handleRedeal = () => {
    return
    const newState = reshuffle(this.state)
    this.setState(newState)
  }

  removeSet = () => {
    const { declarer, selected } = this.state
    if (isSet(selected)) {
      console.log('Set found, removing')
      const newScores = this.markPointForDeclarer(declarer)
      const newState = {
        ...newScores,
        setFound: false,
        declarer: null,
        timeDeclared: null,
        ...removeSelectedCards(this.state),
      }
      this.setState(newState)
    }
    clearInterval(this.cpuTimer)
    setTimeout(() => {
      this.cpuTimer = setInterval(this.cpuTurn, this.state.cpuTurnInterval)
    }, config.cpuDelay)
  }

  resetGame = () => {
    clearInterval(this.cpuTimer)
    this.setState({
      ...cloneDeep(initialState),
      ...createGameState(),
    })
  }

  render() {
    const {
      board,
      deck,
      selected,
      declarer,
      players,
      gameStarted,
      setFound,
      setsFound,
      popupVisible,
    } = this.state
    const { userReducer } = this.props
    const { user } = userReducer
    if (userReducer.loading) {
      return 'Loading...'
    }
    if (!gameStarted) {
      return (
        <div className="container">
          {user !== null && <Signout />}
          <h3>Puzzle Mode</h3>
          <p>Find as many sets as you can</p>
          <div className="row">
            <div className="col s8 m4">
              {/* <Slider
                ref={(input) => {
                  this.difficultyInput = input
                }}
                min={2}
                max={4}
                orientation="horizontal"
                tooltip={true}
                // labels={{ 2: 6, 3: 9, 4: 12 }}
                format={(v) => 3 * v}
                value={Number(this.state.cardsOnBoard) / 3}
                onChange={(cards) => {
                  this.setState({
                    cardsOnBoard: cards * 3,
                  })
                }}
              /> */}
              <form onSubmit={this.handleStartGame}>
                <input type="submit" value="Start" className="btn" />
              </form>
            </div>
            <div className="row">
              <div style={{ marginTop: '48px' }} className="col s12">
                <p style={{ marginTop: '36px' }}>
                  <Link to="/solo">Back to Solo Menu</Link>
                </p>
                {!user && (
                  <Fragment>
                    <hr />
                    <p>To save your stats, sign in with your Google account.</p>

                    <p>
                      <button onClick={handleGoogleRedirect} className="btn">
                        Sign in
                      </button>
                    </p>
                  </Fragment>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    }
    return (
      <React.Fragment>
        <Modal visible={popupVisible}>
          <p className="flow-text center-align">{this.state.popUpText}</p>
        </Modal>
        <Board
          board={board}
          deck={deck}
          selected={selected}
          declarer={declarer}
          handleCardClick={this.handleCardClick}
          handleDeclare={this.handleDeclare}
          players={players}
          setFound={this.state.setFound}
          gameOver={this.state.gameOver}
          myName={this.state.name}
          resetGame={this.resetGame}
          solo={true}
          gameMode="puzzle"
          setsFound={setsFound}
          startTime={this.state.startTime}
          elapsedTime={this.state.elapsedTime}
        />
      </React.Fragment>
    )
  }
}

const mapStateToProps = (state) => ({
  userReducer: state.user,
})

export default connect(mapStateToProps)(Puzzle)
