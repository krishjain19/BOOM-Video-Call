import React, { useContext, useState } from "react";
import withAuth from "../utils/withAuth";
import { useNavigate } from "react-router-dom";
import { IconButton } from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import { AuthContext } from "../context/AuthContext";

function HomeComponent() {
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");
  const { addToUserHistory } = useContext(AuthContext);

  const handleJoinVideoCall = async () => {
    if (!meetingCode.trim()) return;
    await addToUserHistory(meetingCode);
    navigate(`/${meetingCode}`);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      {/* Navbar */}
      <nav
        className="d-flex justify-content-between align-items-center px-3 px-md-5 py-3 bg-white border-bottom"
        style={{ position: "sticky", top: 0, zIndex: 100 }}
      >
        <h2 style={{ margin: 0, fontWeight: 700, fontSize: "1.4rem" }}>
          Boom Video Call
        </h2>

        <div className="d-flex align-items-center gap-2 gap-md-3">
          <IconButton
            size="small"
            onClick={() => navigate("/history")}
            title="Meeting History"
          >
            <RestoreIcon />
          </IconButton>
          <span
            className="d-none d-sm-inline text-secondary small"
            style={{ cursor: "default" }}
          >
            History
          </span>

          <button
            type="button"
            className="btn btn-sm btn-outline-dark rounded-1 ms-2"
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/auth");
            }}
          >
            Log Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container py-5">
        <div className="row align-items-center justify-content-center" style={{ minHeight: "75vh" }}>

          {/* Left: Join Form */}
          <div className="col-12 col-md-6 col-lg-5 mb-5 mb-md-0">
            <h3 className="fw-bold mb-1" style={{ fontSize: "clamp(1.3rem, 3vw, 1.8rem)" }}>
              Join a Meeting
            </h3>
            <p className="text-secondary mb-4">Enter a meeting code to get started.</p>

            <div className="mb-3">
              <label htmlFor="meetingCodeInput" className="form-label fw-medium text-secondary small">
                Meeting Code
              </label>
              <input
                id="meetingCodeInput"
                type="text"
                className="form-control rounded-1 py-2"
                placeholder="Enter meeting code"
                value={meetingCode}
                onChange={(e) => setMeetingCode(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleJoinVideoCall(); }}
                autoComplete="off"
              />
            </div>

            <button
              type="button"
              className="btn w-100 rounded-1 py-2 fw-semibold text-white border-0"
              style={{
                backgroundColor: meetingCode.trim() ? "#ff7b00" : "#adb5bd",
                cursor: meetingCode.trim() ? "pointer" : "not-allowed",
                transition: "background-color 0.15s ease-in-out",
              }}
              onClick={handleJoinVideoCall}
              disabled={!meetingCode.trim()}
            >
              Join Meeting
            </button>
          </div>

          {/* Right: Illustration */}
          <div className="col-12 col-md-6 col-lg-5 d-none d-md-flex justify-content-center">
            <img
              src="/logo.png"
              alt="Video Call Illustration"
              style={{ width: "100%", maxWidth: "380px", borderRadius: "12px", objectFit: "contain" }}
            />
          </div>

        </div>
      </div>
    </div>
  );
}

export default withAuth(HomeComponent);
