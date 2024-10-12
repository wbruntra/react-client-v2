import React, { Component, Fragment, useEffect, useState } from 'react'
import { debounce, get, isEmpty, map } from 'lodash'

import Card from './Card'
import GameOver from './GameOver'
import Modal from 'react-bootstrap/Modal'
import TopBar from './TopBar'
import { countSets } from '../utils/helpers'
import _ from 'lodash'

function SharedPlayersDisplay({ players, declarer, handlePlayerClick }) {
  return (
    <div className="row my-4 text-center justify-content-between">
      {players.map((info) => {
        return (
          <div
            className={`col-2 bg-${info.color} ${info.name == declarer ? 'active-player' : ''}`}
            onClick={() => {
              handlePlayerClick(info.name)
            }}
            key={info.name}
          >
            <p className="my-2 align-middle">{info.name == declarer ? 'SET!' : info.score}</p>
          </div>
        )
      })}
    </div>
  )
}

function Board(props) {
  const [sets, setSets] = useState(null)
  const [windowHeight, setWindowHeight] = useState(window.innerHeight)
  const {
    board,
    selected,
    deck,
    declarer,
    players,
    gameOver,
    myName,
    setFound,
    sharedDevice,
    solo,
    gameMode,
  } = props

  useEffect(() => {
    const resize = debounce(() => {
      setWindowHeight(window.innerHeight)
    }, 150)

    window.addEventListener('resize', resize)

    return function cleanup() {
      window.removeEventListener('resize', resize)
    }
  }, [])

  useEffect(() => {
    setSets(countSets(board, { debug: process.env.NODE_ENV !== 'production' }))
  }, [board])

  const getBorderColor = ({ declarer, players }) => {
    if (declarer) {
      return get(players, `${declarer}.color`, '')
    }
    return get(players, `${myName}.color`, '')
  }

  const borderColor = getBorderColor(props)

  if (!isEmpty(gameOver)) {
    return <GameOver gameOver={gameOver} myName={myName} solo={solo} />
  }

  let playersArray = map(players, (info, name) => {
    return {
      name,
      ...info,
    }
  })

  playersArray = _.orderBy(playersArray, (p) => p.position, 'asc')

  const topBoxes = Math.ceil(playersArray.length / 2)
  const topPlayers = playersArray.slice(0, topBoxes)
  const bottomPlayers = playersArray.slice(topBoxes)

  return (
    <Fragment>
      {(isEmpty(players) || !Object.keys(players).includes(myName)) && (
        <Modal show>
          <Modal.Header>
            <Modal.Title>Waiting to join...</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h4>Players:</h4>
            <ul className="collection">
              {map(players, (info, name) => {
                return (
                  <li key={name} className="collection-item">
                    <span className={`player-name`}>
                      {name} {info.host && '(host)'}
                    </span>
                  </li>
                )
              })}
            </ul>
          </Modal.Body>
        </Modal>
      )}

      <TopBar {...props} />
      <div className="container">
        {sharedDevice && (
          <SharedPlayersDisplay
            players={topPlayers}
            declarer={declarer}
            handlePlayerClick={props.handlePlayerClick}
          />
        )}

        <div className="board d-flex flex-column align-items-center">
          <div className="board-main-container">
            {board.map((card) => {
              return (
                <div
                  key={card}
                  className={`card-wrapper`}
                  onClick={() => {
                    props.handleCardClick(card)
                  }}
                >
                  <div
                    className={`card-holder ${selected.includes(card) ? `bg-${borderColor}` : ''}`}
                  >
                    <div
                      className={`card ${
                        setFound && selected.length === 3 && !selected.includes(card)
                          ? 'blurry'
                          : ''
                      }`}
                    >
                      <Card desc={card} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {!sharedDevice && !['puzzle', 'training'].includes(gameMode) && (
            <div className="row my-1 text-center fixed-bottom">
              {map(playersArray, (info) => {
                const { name } = info

                return (
                  <div key={name} className="col s4 m3">
                    <span className={`player-name bg-${info.color}`}>
                      {name}: {info.score}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {props.handleRedeal && (
            <div className="row mt-3">
              <div className="col mt-3 mt-md-4">
                <button onClick={props.handleRedeal} className="btn btn-primary">
                  Shuffle
                </button>
              </div>
            </div>
          )}
        </div>
        {sharedDevice && (
          <SharedPlayersDisplay
            players={bottomPlayers}
            declarer={declarer}
            handlePlayerClick={props.handlePlayerClick}
          />
        )}
      </div>
    </Fragment>
  )
}

export default Board
