import React from "react";
import "../App.css";
import { useNavigate } from "react-router-dom";
const landing = () => {

  const router = useNavigate();

  return (
    <div>
      <div className="LandingPageContainer">
        <nav>
          <div className="navHeader">
            <h2>Boom</h2>
          </div>

          <div className="navlist">
            <p onClick={() => {
              router("/asdfe")
            }}>Join as Guest</p>
            <p onClick={() =>{router("/auth")}}>Register</p>
            <div onClick={() =>{router("/auth")}} role="button">
              <p>Login</p>
            </div>
          </div>
        </nav>

        <div className="LandingMainContainer">
          <div>
            <h1>
              <span style={{ color: "#ff7b00" }}>Connect</span> with your loved
              one
            </h1>
            <p>Long Distance !...what`s that?</p>

            <div role="button">
              <a href="/auth">Get Started</a>
            </div>
          </div>

          <div>
            <img src="/mobile.png" alt="" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default landing;
