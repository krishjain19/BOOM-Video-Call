import React from "react";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";

const EnterIntoLoby = ({
  username = "",
  setUsername,
  connect,
  localVideoRef,
  video = true,
  audio = true,
  handleVideo,
  handleAudio,
  url = "",
}) => {
  const isJoinDisabled = !username || !username.trim();

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-black text-white p-3 p-md-4">
      <div
        className="card bg-dark text-white border border-secondary border-opacity-25 rounded-2 shadow-lg"
        style={{ maxWidth: "960px", width: "100%" }}
      >
        <div className="card-body p-4 p-lg-5">
          <div className="row g-4 align-items-center">
            {/* Left Column: Video Preview and In-Preview Media Toggles */}
            <div className="col-12 col-lg-7">
              <div
                className="position-relative bg-black rounded-2 overflow-hidden border border-secondary border-opacity-25"
                style={{ aspectRatio: "16 / 9" }}
              >
                {/* Local Video Stream */}
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: "scaleX(-1)",
                    display: video ? "block" : "none",
                  }}
                />

                {/* Camera Off Placeholder */}
                {!video && (
                  <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-secondary">
                    <VideocamOffIcon style={{ fontSize: "3rem" }} />
                    <span className="small mt-2">Camera is turned off</span>
                  </div>
                )}

                {/* Floating Media Controls (Mic & Camera Toggles) */}
                <div
                  className="position-absolute bottom-0 start-50 translate-middle-x mb-3 d-flex gap-2"
                  style={{ zIndex: 10 }}
                >
                  {handleAudio && (
                    <button
                      type="button"
                      className={`btn btn-sm ${
                        audio
                          ? "btn-dark border border-secondary text-white"
                          : "btn-danger"
                      } rounded-1 px-3 d-flex align-items-center gap-1 shadow-sm`}
                      style={{
                        backgroundColor: audio
                          ? "rgba(20, 20, 20, 0.85)"
                          : undefined,
                        backdropFilter: "blur(4px)",
                      }}
                      onClick={handleAudio}
                      title={audio ? "Mute Microphone" : "Unmute Microphone"}
                    >
                      {audio ? (
                        <MicIcon fontSize="small" />
                      ) : (
                        <MicOffIcon fontSize="small" />
                      )}
                      <span className="small">{audio ? "Mic On" : "Muted"}</span>
                    </button>
                  )}

                  {handleVideo && (
                    <button
                      type="button"
                      className={`btn btn-sm ${
                        video
                          ? "btn-dark border border-secondary text-white"
                          : "btn-danger"
                      } rounded-1 px-3 d-flex align-items-center gap-1 shadow-sm`}
                      style={{
                        backgroundColor: video
                          ? "rgba(20, 20, 20, 0.85)"
                          : undefined,
                        backdropFilter: "blur(4px)",
                      }}
                      onClick={handleVideo}
                      title={video ? "Turn Off Camera" : "Turn On Camera"}
                    >
                      {video ? (
                        <VideocamIcon fontSize="small" />
                      ) : (
                        <VideocamOffIcon fontSize="small" />
                      )}
                      <span className="small">
                        {video ? "Camera On" : "Camera Off"}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Status bar */}
              <div className="d-flex justify-content-between text-secondary small mt-2 px-1">
                <span>
                  Microphone:{" "}
                  <strong className={audio ? "text-success" : "text-danger"}>
                    {audio ? "Active" : "Muted"}
                  </strong>
                </span>
                <span>
                  Video:{" "}
                  <strong className={video ? "text-success" : "text-danger"}>
                    {video ? "Active" : "Off"}
                  </strong>
                </span>
              </div>
            </div>

            {/* Right Column: Room Details, Name Input & Join Action */}
            <div className="col-12 col-lg-5">
              <div className="mb-3">
                <span className="badge bg-secondary bg-opacity-25 text-light border border-secondary border-opacity-25 rounded-1 mb-2 px-2 py-1">
                  Meeting Lobby
                </span>
                <h1 className="h4 fw-bold mb-1">Ready to join?</h1>
                {url && (
                  <p className="text-secondary small mb-0">
                    Room:{" "}
                    <code className="text-light bg-black px-2 py-1 rounded-1 border border-secondary border-opacity-25">
                      {url}
                    </code>
                  </p>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!isJoinDisabled) {
                    connect();
                  }
                }}
              >
                <div className="mb-3">
                  <label
                    htmlFor="lobbyDisplayName"
                    className="form-label text-secondary small fw-medium"
                  >
                    Your Display Name
                  </label>
                  <input
                    id="lobbyDisplayName"
                    type="text"
                    className="form-control bg-black text-white border-secondary rounded-1 py-2"
                    placeholder="Enter your name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="off"
                    autoFocus
                  />
                  <div className="form-text text-secondary small mt-1">
                    Other participants will see this name during the call.
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn w-100 rounded-1 py-2 fw-semibold text-white shadow-sm border-0"
                  style={{
                    backgroundColor: isJoinDisabled ? "#495057" : "#ff7b00",
                    cursor: isJoinDisabled ? "not-allowed" : "pointer",
                    transition: "background-color 0.15s ease-in-out",
                  }}
                  disabled={isJoinDisabled}
                >
                  Join Meeting
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterIntoLoby;