import React, { useEffect } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Main from './components/Main'
import Rules from './components/Rules'
import Solo from './components/Solo'
import Training from './components/Training'
import Host from './components/Host'
import GoogleAccount from './components/GoogleAccount'
import Lobby from './components/Lobby'
import Guest from './components/Guest'

function AppRouter() {
  return (
    <Router>
      <div className="container-fluid">
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/solo" element={<Solo />} />
          <Route path="/training" element={<Training />} />
          <Route path="/host" element={<Host />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/guest/:gameName" element={<Guest />} />
          <Route path="/login" element={<GoogleAccount />} />
        </Routes>
      </div>
    </Router>
  )
}

export default AppRouter
