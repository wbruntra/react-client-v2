import React, { Component, Fragment } from 'react'
import {
  cardToggle,
  handleGoogleRedirect,
  isSet,
  makeDeck,
  nameThird,
  removeSelected as removeSelectedCards,
  reshuffle,
} from '../utils/helpers'
import { cloneDeep, isEmpty, shuffle } from 'lodash'

import Board from './Board'
import { Range } from 'react-range'
import { Link } from 'react-router-dom'
import Signout from './Signout'
// import Slider from 'react-rangeslider'
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

const calculateIntervalFromDifficulty = (d) => {
  let diff = Number(d)
  if (Number.isNaN(diff)) {
    diff = 1
  }
  const interval = 24000 / (5 * diff)
  return interval
}

const createGameState = () => {
  const initialDeck = makeDeck()
  const selected = []
  return {
    ...reshuffle({
      deck: initialDeck.slice(12),
      board: initialDeck.slice(0, 12),
    }),
    selected,
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
    cpu: {
      score: 0,
      color: config.colors[1],
    },
  },
  gameStarted: false,
  myName: 'you',
  setFound: false,
  declarer: null,
  gameOver: null,
  cpuTurnInterval: 1000,
  startTime: new Date(),
}

class Solo extends Component {
  constructor(props) {
    super(props)
    this.state = {
      ...cloneDeep(initialState),
      ...createGameState(),
      difficulty: 2,
    }
  }

  handleStartGame = (e) => {
    e.preventDefault()
    this.setState({
      gameStarted: true,
      startTime: new Date(),
    })

    console.log(`Turns every ${this.state.cpuTurnInterval} ms`)
    setTimeout(() => {
      const cpuTimer = window.setInterval(this.cpuTurn, this.state.cpuTurnInterval)
      this.setState({
        cpuTimer,
      })
    }, config.cpuDelay)
  }

  componentDidMount = () => {
    const savedDifficulty = window.localStorage.getItem('soloDifficulty')
    let difficulty = savedDifficulty ? Number(savedDifficulty) : 2
    const cpuTurnInterval = calculateIntervalFromDifficulty(difficulty)
    this.setState({
      difficulty,
      cpuTurnInterval,
    })
  }

  componentWillUnmount = () => {
    if (this.state.cpuTimer !== null) {
      window.clearInterval(this.state.cpuTimer)
    }
  }

  cpuTurn = () => {
    const { board, declarer, gameOver } = this.state
    if (declarer || gameOver) {
      return
    }
    if (debugging) {
      logTime('Guess')
    }
    const [a, b] = shuffle(board).slice(0, 2)
    const c = nameThird(a, b)
    if (board.includes(c)) {
      this.setState({
        declarer: 'cpu',
        selected: [a],
        cpuFound: [b, c],
        setFound: true,
      })
      if (this.state.cpuTimer !== null) {
        clearInterval(this.state.cpuTimer)
      }
      this.setState({
        cpuAnimation: window.setInterval(this.animateCpuChoice, 900),
      })
    }
  }

  animateCpuChoice = () => {
    const { selected, cpuFound } = this.state
    const cpuCopy = [...cpuFound]
    if (cpuCopy.length === 0) {
      return
    }
    const newSelected = [...selected, cpuCopy.pop()]
    this.setState({
      cpuFound: cpuCopy,
      selected: newSelected,
    })
    if (newSelected.length === 3) {
      if (this.state.cpuAnimation !== null) {
        clearInterval(this.state.cpuAnimation)
      }
      this.updateSelected(newSelected, 'cpu')
    }
  }

  updatePlayerScore = (myName, delta) => {
    const { players } = this.state
    const newScore = players[myName].score + delta
    const newPlayers = produce(players, (draft) => {
      draft[myName].score = newScore
    })

    return [newPlayers, newScore]
  }

  expireDeclare = () => {
    const { declarer, selected } = this.state
    if (declarer && !isSet(selected)) {
      const [newPlayers] = this.updatePlayerScore(declarer, -0.5)
      this.setState({
        players: newPlayers,
        declarer: null,
        timeDeclared: undefined,
        selected: [],
      })
    }
  }

  markPointForDeclarer = (declarer) => {
    const [newPlayers, newScore] = this.updatePlayerScore(declarer, 1)
    const { user } = this.props.userReducer
    const gameOver = newScore >= config.playingTo ? declarer : ''
    const newState = {
      players: newPlayers,
      gameOver,
    }
    if (!isEmpty(gameOver)) {
      const uid = (user && user.uid) || 'anonymous'
      const player_won = declarer == 'you' ? 1 : 0
      const total_time = Math.round((new Date().getTime() - this.state.startTime.getTime()) / 1000)
      axios
        .post('/api/game', {
          uid,
          total_time,
          player_won,
          difficulty_level: this.state.difficulty,
          winning_score: newScore,
        })
        .then(() => {
          console.log('Game sent')
        })
        .catch((err) => {
          console.log('Error sending game')
        })
    }
    this.setState(newState)
    return newState
  }

  performDeclare = (declarer) => {
    if (!this.state.declarer) {
      const timeNow = new Date().getTime()
      const update = {
        declarer,
        timeDeclared: timeNow,
      }
      this.setState(update)
      this.setState({
        undeclareId: window.setTimeout(() => {
          this.expireDeclare()
        }, config.turnTime),
      })
    }
  }

  updateSelected = (newSelected, declarer) => {
    const newState = {
      setFound: isSet(newSelected),
      selected: newSelected,
      declarer,
    }
    if (newState.setFound) {
      this.state.undeclareId && clearTimeout(this.state.undeclareId)
      setTimeout(() => {
        this.removeSet()
      }, 2000)
    }
    this.setState(newState)
  }

  handleCardClick = (card) => {
    const { setFound, declarer, myName } = this.state
    if (!setFound && declarer !== 'cpu') {
      const newSelected = cardToggle(card, this.state.selected)
      if (!declarer) {
        this.performDeclare(myName)
      }
      this.setState({
        selected: newSelected,
      })
      if (isSet(newSelected)) {
        this.updateSelected(newSelected, 'you')
      }
    }
  }

  handleRedeal = () => {
    const newState = reshuffle(this.state)
    this.setState(newState)
  }

  removeSet = () => {
    const { declarer, selected } = this.state
    if (declarer && isSet(selected)) {
      console.log('Set found, removing')
      this.markPointForDeclarer(declarer)
      const newState = {
        setFound: false,
        declarer: null,
        timeDeclared: undefined,
        ...removeSelectedCards(this.state),
      }
      this.setState(newState)
    }
    this.state.cpuTimer && clearInterval(this.state.cpuTimer)
    setTimeout(() => {
      const cpuTimer = window.setInterval(this.cpuTurn, this.state.cpuTurnInterval)
      this.setState({
        cpuTimer,
      })
    }, config.cpuDelay)
  }

  resetGame = () => {
    this.state.cpuTimer && window.clearInterval(this.state.cpuTimer)
    this.setState({
      ...cloneDeep(initialState),
      ...createGameState(),
    })
  }

  render() {
    const { board, deck, selected, declarer, players, gameStarted, setFound } = this.state
    const { userReducer } = this.props
    const { user } = userReducer
    if (userReducer.loading) {
      return 'Loading...'
    }
    if (!gameStarted) {
      // GameSettings
      return (
        <div className="container main-content">
          {user !== null && <Signout />}
          <h3 className="text-center mb-4">Solo Play vs. Computer</h3>
          <h4 className="mb-4">Choose difficulty level:</h4>
          <div className="row">
            <div className="col-12">
              <form onSubmit={this.handleStartGame}>
                <div className="col-10 col-md-6 mb-5">
                  <Range
                    step={1}
                    min={1}
                    max={8}
                    values={[this.state.difficulty]}
                    onChange={(difficulty) => {
                      const cpuTurnInterval = calculateIntervalFromDifficulty(difficulty)
                      window.localStorage.setItem('soloDifficulty', difficulty.toString())
                      this.setState({
                        cpuTurnInterval,
                        difficulty,
                      })
                    }}
                    renderTrack={({ props, children }) => (
                      <div
                        {...props}
                        style={{
                          ...props.style,
                          height: '6px',
                          width: '100%',
                          backgroundColor: '#ccc',
                        }}
                      >
                        {children}
                      </div>
                    )}
                    renderThumb={({ props }) => (
                      <div
                        {...props}
                        style={{
                          ...props.style,
                          height: '24px',
                          width: '24px',
                          backgroundColor: '#999',
                        }}
                      />
                    )}
                  />
                </div>
                <input type="submit" value="Start" className="btn btn-primary" />
              </form>
              <p style={{ marginTop: '24px' }}>First to {config.playingTo} points is the winner</p>
            </div>
            <div className="row mt-4">
              <p>Other Game Options:</p>
              <ul style={{ listStyleType: 'none' }}>
                <li className="mb-4">
                  <Link to="/local">Local Multiplayer</Link>
                </li>
                <li className="mb-4">
                  <Link to="/training">Training</Link>
                </li>
                <hr />
                <li>
                  <Link to="/">Back to Main Menu</Link>
                </li>
              </ul>
            </div>
          </div>
          {!user && (
            <div className="row mt-4">
              <div>
                <p>To save your game statistics, sign in with your Google account.</p>

                <p>
                  <button onClick={handleGoogleRedirect} className="btn btn-info">
                    Sign in
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      )
    }
    return (
      <React.Fragment>
        <Board
          board={board}
          deck={deck}
          selected={selected}
          declarer={declarer}
          handleCardClick={this.handleCardClick}
          handleDeclare={() => {}}
          handleRedeal={this.handleRedeal}
          players={players}
          setFound={this.state.setFound}
          gameOver={this.state.gameOver}
          myName={this.state.myName}
          resetGame={this.resetGame}
          solo={true}
          gameMode="versus"
        />
      </React.Fragment>
    )
  }
}

const mapStateToProps = (state) => ({
  userReducer: state.user,
})

export default connect(mapStateToProps)(Solo)
