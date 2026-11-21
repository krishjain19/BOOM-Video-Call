import React from 'react'
import { TextField, Button } from "@mui/material";

const EnterIntoLoby = () => {
  return (
    <div>
          <h2>Enter into loby</h2>
          <TextField
            id="outlined-basic"
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            variant="outlined"
          />
          <Button variant="contained" onClick={connect}>
            Join Meeting
          </Button>

          <div>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: "100%",
                maxWidth: "600px",
                borderRadius: "20px",
                margin: "1rem",
                transform: "scaleX(-1)",
              }}
            />
          </div>
        </div>
  )
}

export default EnterIntoLoby
