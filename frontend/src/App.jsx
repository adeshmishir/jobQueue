import React from 'react'
import axios from 'axios'
async function callApi() {
  try {
    const res = await axios.get("http://localhost:5000/");
    console.log(res.data);
  } catch (error) {
    console.error("Error calling API:", error);
  }
}

const App = () => {
  return (
    <div>
      <h1>My App</h1>
      <button onClick={callApi}>Call API</button>
    </div>
  )
}

export default App
