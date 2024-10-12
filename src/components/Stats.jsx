import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { handleGoogleRedirect } from '../utils/helpers'

import axios from 'axios'

function Stats(props) {
  const userReducer = useSelector((state) => state.user)
  const { user } = userReducer
  const [stats, setStats] = useState(null)
  const dispatch = useDispatch()

  useEffect(() => {
    const getStats = async () => {
      axios.get(`/api/user/stats/${user.uid}`).then((response) => {
        setStats(response.data)
      })
    }

    if (!userReducer.loading && user !== null) {
      getStats()
    }
  }, [userReducer.loading])

  if (userReducer.loading) {
    return 'Loading...'
  }

  if (user === null) {
    return (
      <div className="container mt-4">
        <p>Sign in to view stats</p>
        <p>
          <button onClick={handleGoogleRedirect} className="btn btn-info">
            Sign in
          </button>
        </p>
      </div>
    )
  }

  return (
    <div className="container mt-2 mt-md-4">
      <h3>Statistics</h3>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Difficulty</th>
            <th>Games Played</th>
            <th>Winning Percentage</th>
          </tr>
        </thead>

        <tbody>
          {stats &&
            stats.map((row, i) => {
              return (
                <tr key={`stats-${i}`}>
                  <td>{row.difficulty_level}</td>
                  <td>{row.games_played}</td>
                  <td>{Math.round(100 * (row.games_won / row.games_played))}%</td>
                </tr>
              )
            })}
        </tbody>
      </table>
      <p>
        <Link to="/">Main Menu</Link>
      </p>
    </div>
  )
}

export default Stats
