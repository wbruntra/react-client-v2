// import React, { useState } from 'react'
// import Signout from './Signout'
// import { useSelector } from "react-redux";
// import Slider from 'react-rangeslider'

// const calculateIntervalFromDifficulty = (d: number) => {
//   let diff = Number(d)
//   if (Number.isNaN(diff)) {
//     diff = 1
//   }
//   const interval = 24000 / (5 * diff)
//   return interval
// }

// const GameSettings = ({ handleStartGame }) => {
//   const user = useSelector((state: any) => state.user.user)

//   return (
//     <div className="container">
//       {user !== null && <Signout />}
//       <h3 className="text-center">Solo Play vs. Computer</h3>
//       <h4 className="text-orange">Choose difficulty level:</h4>
//       <div className="row">
//         <div className="col s8 m4">
//           <form onSubmit={handleStartGame}>
//             <Slider
//               min={1}
//               max={5}
//               orientation="horizontal"
//               tooltip={true}
//               value={Number(this.state.difficulty)}
//               onChange={(difficulty) => {
//                 const cpuTurnInterval = calculateIntervalFromDifficulty(difficulty)
//                 window.localStorage.setItem('soloDifficulty', difficulty.toString())
//                 this.setState({
//                   cpuTurnInterval,
//                   difficulty,
//                 })
//               }}
//             />
//             <input type="submit" value="Start" className="btn" />
//           </form>
//           <p style={{ marginTop: '24px' }}>First to {config.playingTo} points is the winner</p>
//         </div>
//         <div className="row">
//           <div style={{ marginTop: '48px' }} className="col s12">
//             <p>
//               <Link to="/local">Local Multiplayer</Link>
//             </p>
//             <p style={{ marginTop: '36px' }}>
//               <Link to="/">Back to Main Menu</Link>
//             </p>
//             {!user && (
//               <Fragment>
//                 <hr />
//                 <p>To save your stats, sign in with your Google account.</p>

//                 <p>
//                   <button onClick={handleGoogleRedirect} className="btn">
//                     Sign in
//                   </button>
//                 </p>
//               </Fragment>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default GameSettings
