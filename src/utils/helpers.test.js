import { makeDeck, reshuffle, countSets } from './helpers'

it('builds a proper deck', () => {
  const deck = makeDeck()
  expect(deck.length).toBe(81)
})

it('always has a set on board', () => {
  const deck = makeDeck()
  let newDeck, board
  let flag = false
  for (let i = 0; i < 350; i++) {
    newDeck = reshuffle({ board: deck.slice(0, 12), deck: deck.slice(12) })
    ;({ board } = newDeck)
    if (countSets(board) === 0) {
      flag = true
      break
    }
  }
  expect(flag).toBeFalsy()
})
