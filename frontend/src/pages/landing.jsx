import React from "react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const router = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "url('/background.png') no-repeat center center / cover",
        color: "white",
      }}
    >
      {/* Navbar */}
      <nav className="d-flex justify-content-between align-items-center px-3 px-md-5 py-3">
        <h2 style={{ fontSize: "2rem", fontWeight: 500, margin: 0 }}>Boom</h2>

        <div className="d-flex align-items-center gap-3 gap-md-5">
          <span
            role="button"
            style={{ cursor: "pointer", fontSize: "0.95rem" }}
            onClick={() => router("/asdfe")}
          >
            Join as Guest
          </span>
          <span
            role="button"
            style={{ cursor: "pointer", fontSize: "0.95rem" }}
            onClick={() => router("/auth")}
          >
            Register
          </span>
          <button
            type="button"
            className="btn btn-sm rounded-1 fw-medium border-0 text-white"
            style={{ backgroundColor: "#ff7b00", padding: "6px 16px" }}
            onClick={() => router("/auth")}
          >
            Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container-fluid px-3 px-md-5">
        <div
          className="row align-items-center"
          style={{ minHeight: "85vh" }}
        >
          {/* Left: Text */}
          <div className="col-12 col-md-6 mb-5 mb-md-0">
            <h1
              style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 700, lineHeight: 1.2 }}
            >
              <span style={{ color: "#ff7b00" }}>Connect</span> with your loved one
            </h1>
            <p
              className="mt-3 text-white-50"
              style={{ fontSize: "1.1rem" }}
            >
              Long distance? Not anymore.
            </p>
            <button
              type="button"
              className="btn rounded-1 fw-semibold text-white border-0 mt-4"
              style={{
                backgroundColor: "#ff7b00",
                padding: "10px 28px",
                fontSize: "1rem",
              }}
              onClick={() => router("/auth")}
            >
              Get Started
            </button>
          </div>

          {/* Right: Image (hidden on small phones, shown on md+) */}
          <div className="col-12 col-md-6 d-none d-md-flex justify-content-end">
            <img
              src="/mobile.png"
              alt="Boom Video Call"
              style={{ height: "75vh", maxHeight: "600px", objectFit: "contain" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
