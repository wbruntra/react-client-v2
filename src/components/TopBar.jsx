import React, { useEffect, useState } from 'react'

import { Link } from 'react-router-dom'
import { colors } from '../config'
import { countSets } from '../utils/helpers'
import useInterval from '../useInterval'

const formatTime = (seconds) => {
  const pad = (ss) => {
    var p = '00'
    var result = (p + ss).slice(-p.length)
    return result
  }
  const mm = Math.floor(seconds / 60)
  const ss = seconds - 60 * mm
  return `${mm}:${pad(ss)}`
}

function TopBar({ gameMode, deck, board, declarer, setsFound, players, elapsedTime, timeLeft }) {
  const sets = countSets(board)

  switch (gameMode) {
    case 'shared-device':
      return null
    case 'versus':
      return (
        <div className={`topbar py-2 bg-${declarer ? 'light' : 'dark'}-orange`}>
          <nav className="text-white">
            <div className="d-flex justify-content-around text-center">
              <div>Sets: {sets}</div>
              <div>{declarer && <>SET! {declarer}</>}</div>
            </div>
          </nav>
        </div>
      )
    case 'puzzle':
      return (
        <div className="navbar-fixed">
          <nav>
            <div
              className="nav-wrapper"
              style={{ display: 'flex', justifyContent: 'space-between' }}
            >
              <div>Total Sets: {sets}</div>
              <div>Remaining: {sets - setsFound.length}</div>
              <div>Time: {formatTime(elapsedTime)}</div>
            </div>
          </nav>
        </div>
      )
    case 'training':
      return (
        <div className="topbar py-2 bg-dark-orange navbar-fixed">
          <nav>
            <div className="nav-wrapper d-flex justify-content-around">
              <div>Time: {formatTime(elapsedTime)}</div>
              {/* <div>Hello World!</div> */}
              <div>Score: {players.you.score}</div>
              <div>Remaining: {timeLeft > 0 ? timeLeft : 'X'}</div>
            </div>
          </nav>
        </div>
      )
    default:
      return null
  }
}

export default TopBar
