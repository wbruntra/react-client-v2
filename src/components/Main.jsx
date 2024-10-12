import React from 'react'
import { Link } from 'react-router-dom'
import Card from './Card'

function MenuItem(props) {
  const { url, cardName, description } = props
  return (
    <div className="col-9 col-md-4">
      <Link to={url}>
        <div className="card shadow-sm mb-3 mb-md-4">
          <Card desc={cardName} />
        </div>
      </Link>
      <p className="text-center">{description}</p>
    </div>
  )
}

function Main() {
  const menuItems = [
    {
      url: '/solo',
      cardName: '0012',
      description: 'Solo/Local',
    },
    {
      url: '/lobby',
      cardName: '1121',
      description: 'Join Game',
    },
    {
      url: '/host',
      cardName: '2200',
      description: 'Host Game',
    },
  ]
  return (
    <div className="container mt-3 mt-md-5">
      <h1 className="d-none d-md-block text-center mb-3 mb-md-5">Main Menu</h1>
      <div className="row justify-content-center">
        {menuItems.map((item, i) => {
          return <MenuItem key={`card-${i}`} {...item} />
        })}
      </div>
      <div className="d-none d-md-block">
        <hr />
        <p>
          <Link to="/rules">Rules</Link>
        </p>
        <p>
          <Link to="/stats">View Statistics</Link>
        </p>
        <p>
          <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  )
}

export default Main
