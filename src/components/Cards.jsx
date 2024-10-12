import React, { Component } from 'react'
import Card from './Card'
import { makeDeck, reshuffle } from '../utils/helpers'

class Cards extends Component {
  constructor(props) {
    super(props)
    const initialDeck = makeDeck()
    const initialGameState = {
      ...reshuffle({
        deck: initialDeck.slice(12),
        board: initialDeck.slice(0, 12),
      }),
      selected: [],
    }
    const players = {
      host: 0,
    }

    this.state = {
      players,
      setFound: false,
      autoplay: false,
      declarer: null,
      timeDeclared: null,
      gameOver: false,
      ...initialGameState,
    }
  }
  render() {
    console.log(this.state.board)
    return (
      <div>
        {this.state.board.map((desc) => {
          return <Card key={desc} desc={desc} />
        })}
      </div>
    )
  }
}

export default Cards
