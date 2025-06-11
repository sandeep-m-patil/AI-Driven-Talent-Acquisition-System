import Image from 'next/image'
import React from 'react'

function page() {
  return (
    <div>

      <div style={{ padding: "20px", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", width: "40%", margin: "auto", backgroundColor: "#0000",fontFamily: "Arial, sans-serif" }}>

        <div style={{ display: "flex" }}>
          <h3 style={{ marginRight: "50px" }}>Sales Development Representative (SDR) </h3>
        </div>

        <h4>IBM</h4>
        <p>Location: Bengaluru</p>
        <p>0-3 Yrs</p>
        <button style={{ backgroundColor: "blue", color: "white", padding: "10px 20px", borderRadius: "5px", border: "none" }}>
          <a href="https://www.ibm.com/in-en" target='_blank' style={{ color: "white", textDecoration: "none" }}>Apply Now</a>
        </button>
      </div>
    </div>
  )
}

export default page
