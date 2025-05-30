import React from 'react'
import Header from './_components/Header'
function DashBoardLayout( {children}) {
  return (
    <div>
      <Header/>
      {children}
    </div>
  )
}

export default DashBoardLayout
