import React, { Component } from 'react'
import Board from './Board'
import { makeDeck, cardToggle, reshuffle, removeSelected, isSet } from '../utils/helpers'
import update from 'immutability-helper'
import firestore from '../firestore'

class CreateGameForm extends Component {
  render() {
    const { board, deck, selected, declarer, players } = this.state
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

export default CreateGameForm
