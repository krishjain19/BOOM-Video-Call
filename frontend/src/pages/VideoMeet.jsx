import CallEnd from "@mui/icons-material/CallEnd";
import Mic from "@mui/icons-material/Mic";
import MicOff from "@mui/icons-material/MicOff";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";

import { Badge, Button, IconButton, TextField } from "@mui/material";

import { Chat } from "@mui/icons-material";
import ScreenShare from "@mui/icons-material/ScreenShare";
import StopScreenShare from "@mui/icons-material/StopScreenShare";
import styles from "../styles/videoComponent.module.css";
import server from "../environment";
import server from "../environment";

const server_url =
  window.location.hostname === "localhost" ? server.dev : server.prod;

var connections = {};

const peerConfigConnections = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export default function VideoMeetComponent() {
  const { url } = useParams();

  var socketRef = useRef();
  let socketIdref = useRef();

  let localVideoRef = useRef();

  let [videoAvailable, setVideoAvailable] = useState(true);

  let [audioAvailable, setAudioAvailable] = useState(true);

  let [video, setVideo] = useState(true);

  let [audio, setAudio] = useState();

  let [screen, setScreen] = useState();

  let [showModal, setShowModal] = useState(true);

  let [screenAvailable, setScreenAvailable] = useState(true);

  let [messages, setMessages] = useState([]);

  let [message, setMessage] = useState("");

  let [newMessages, setNewMessages] = useState(3);

  let [askForUsername, setAskForUsername] = useState(true);

  let [username, setUsername] = useState("");

  const videoRef = useRef([]);

  let [videos, setVideos] = useState([]);

  const getPermission = async () => {
    let videoAllowed = false;
    let audioAllowed = false;
    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      if (videoPermission) {
        setVideoAvailable(true);
      } else {
        setVideoAvailable(false);
      }

      const audioPermission = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      if (audioPermission) {
        setAudioAvailable(true);
      } else {
        setAudioAvailable(false);
      }

      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }

      if (videoAvailable || audioAvailable) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoAvailable,
          audio: audioAvailable,
        });

        if (userMediaStream) {
          window.localStream = userMediaStream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = userMediaStream;
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getPermission();
  }, []);

  let getUserMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdref.current) continue;

      connections[id].addStream(window.localStream);

      connections[id].createOffer().then((description) => {
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription }),
            );
          })
          .catch((e) => console.log(e));
      });
    }

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setVideo(false);
          setAudio(false);

          try {
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }

          //todo blackSilence

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          localVideoRef.current.srcObject = window.localStream;

          for (let id in connections) {
            connections[id].addStream(window.localStream);
            connections[id].createOffer().then((description) => {
              connections[id]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id,
                    JSON.stringify({ sdp: connections[id].localDescription }),
                  );
                })
                .catch((e) => console.log(e));
            });
          }
        }),
    );
  };

  let silence = () => {
    let ctx = new AudioContext();
    let oscillator = ctx.createOscillator();

    let dst = oscillator.connect(ctx.createMediaStreamDestination());

    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };

  let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });
    canvas.getContext("2d").fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  let getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices

        .getUserMedia({ video: video, audio: audio })
        .then(getUserMediaSuccess)
        .then((stream) => {})
        .catch((e) => console.log(e));
    } else {
      try {
        let tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (e) {}
    }
  };

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
    }
  }, [audio, video]);

  let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message);

    if (fromId !== socketIdref.current) {
      if (signal.sdp) {
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              connections[fromId]
                .createAnswer()
                .then((description) => {
                  connections[fromId]
                    .setLocalDescription(description)
                    .then(() => {
                      socketRef.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({
                          sdp: connections[fromId].localDescription,
                        }),
                      );
                    })
                    .catch((e) => console.log(e));
                })
                .catch((e) => console.log(e));
            }
          })
          .catch((e) => console.log(e));
      }

      if (signal.ice) {
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((e) => console.log(e));
      }
    }
  };

  let addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data },
    ]);

    if (socketIdSender !== socketIdref.current) {
      setNewMessages((prevMessages) => prevMessages + 1);
    }
  };

  let connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, {
      secure: server_url.startsWith("https"),
    });

    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-call", window.location.pathname);

      socketIdref.current = socketRef.current.id;

      socketRef.current.on("chat-Message", addMessage);

      socketRef.current.on("userLeft", (id) => {
        setVideos((videos) => videos.filter((video) => video.socketId !== id));
      });
    });

    socketRef.current.on("user-joined", (id, clients) => {
      clients.forEach((socketListId) => {
        if (socketListId === socketIdref.current) return;

        connections[socketListId] = new RTCPeerConnection(
          peerConfigConnections,
        );

        connections[socketListId].onicecandidate = (event) => {
          if (event.candidate != null) {
            socketRef.current.emit(
              "signal",
              socketListId,
              JSON.stringify({ ice: event.candidate }),
            );
          }
        };

        connections[socketListId].onaddstream = (event) => {
          let videoExists = videoRef.current.find(
            (video) => video.socketId === socketListId,
          );

          if (videoExists) {
            setVideos((prevVideos) => {
              const updateVideos = prevVideos.map((v) =>
                v.socketId === socketListId
                  ? { ...v, stream: event.stream }
                  : v,
              );
              videoRef.current = updateVideos;
              return updateVideos;
            });
          } else {
            let newVideo = {
              socketId: socketListId,
              stream: event.stream,
              autoPlay: true,
              playsInline: true,
            };

            setVideos((videos) => {
              const updateVideos = [...videos, newVideo];
              videoRef.current = updateVideos;
              return updateVideos;
            });
          }
        };

        if (window.localStream !== undefined && window.localStream !== null) {
          connections[socketListId].addStream(window.localStream);
        } else {
          // let blackSilence

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          connections[socketListId].addStream(window.localStream);
        }
      });

      if (id === socketIdref.current) {
        for (let id2 in connections) {
          if (id2 === socketIdref.current) continue;

          try {
            connections[id2].addStream(window.localStream);
          } catch (e) {}

          connections[id2].createOffer().then((description) => {
            connections[id2]
              .setLocalDescription(description)
              .then(() => {
                socketRef.current.emit(
                  "signal",
                  id2,
                  JSON.stringify({ sdp: connections[id2].localDescription }),
                );
              })
              .catch((e) => console.log(e));
          });
        }
      }
    });
  };

  let getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  };

  let routeTo = useNavigate();

  let connect = () => {
    setAskForUsername(false);
    getMedia();
  };

  let handleVideo = () => {
    setVideo(!video);
  };
  let handleAudio = () => {
    setAudio(!audio);
  };

  let getDisplayMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }
    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdref.current) continue;

      connections[id].addStream(window.localStream);
      connections[id].createOffer().then((description) => {
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription }),
            );
          })
          .catch((e) => console.log(e));
      });
    }

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setScreen(false);

          try {
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }

          //todo blackSilence

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          localVideoRef.current.srcObject = window.localStream;

          getUserMedia();
        }),
    );
  };

  let getDisplayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: true })
          .then(getDisplayMediaSuccess)
          .then((stream) => {})
          .catch((e) => console.log(e));
      }
    }
  };

  useEffect(() => {
    if (screen !== undefined) {
      getDisplayMedia();
    }
  }, [screen]);

  let handleScreen = () => {
    setScreen(!screen);
  };

  let sendMessage = () => {
    socketRef.current.emit("chat-messages", message, username);
    setMessage("");
  };

  let handleCallEnd = () => {
    try {
      let tracks = localVideoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    } catch (e) {}

    routeTo("/home");
  };

  return (
    <div>
      {askForUsername === true ? (
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
      ) : (
        <div className={styles.meetVideoContainer}>
          <div className={styles.meetingContent}>
            <div className={styles.buttonContainer}>
              <IconButton onClick={handleVideo} style={{ color: "white" }}>
                {video === true ? <VideocamIcon /> : <VideocamOffIcon />}
              </IconButton>

              <IconButton onClick={handleCallEnd} style={{ color: "red" }}>
                <CallEnd />
              </IconButton>

              <IconButton onClick={handleAudio} style={{ color: "white" }}>
                {audio === true ? <Mic /> : <MicOff />}
              </IconButton>

              {screenAvailable === true ? (
                <IconButton onClick={handleScreen} style={{ color: "white" }}>
                  {screen === true ? <ScreenShare /> : <StopScreenShare />}
                </IconButton>
              ) : (
                <></>
              )}

              <Badge badgeContent={newMessages} max={999} color="secondary">
                <Button
                  onClick={() => setShowModal(!showModal)}
                  style={{ color: "green" }}
                >
                  <Chat />
                </Button>
              </Badge>
            </div>

            <video
              className={styles.meetUserVideo}
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              playsInline
              style={{ transform: screen ? "none" : "scaleX(-1)" }}
            ></video>
            <div className={styles.conferenceView}>
              {videos.map((video) => (
                <div key={video.socketId}>
                  {/* <h2> {video.socketId} </h2> */}

                  <video
                    data-socket={video.socketId}
                    ref={(ref) => {
                      if (ref && video.stream) {
                        ref.srcObject = video.stream;
                        ref
                          .play()
                          .catch((err) => console.log("Autoplay error:", err));
                      }
                    }}
                    autoPlay
                    playsInline
                  ></video>
                </div>
              ))}
            </div>
          </div>

          {showModal && (
            <div className={styles.chatRoom}>
              <div className={styles.chatContainer}>
                <h1>Chat</h1>

                <div className={styles.chattingDisplay}>
                  {messages.length > 0 ? (
                    messages.map((item, index) => {
                      return (
                        <div style={{ marginTop: "10px" }} key={index}>
                          <p style={{ fontWeight: "bold", fontSize: "18px" }}>
                            {item.sender}
                          </p>
                          <p style={{ fontSize: "15px" }}>{item.data}</p>
                        </div>
                      );
                    })
                  ) : (
                    <p>no messages yet</p>
                  )}
                </div>

                <div className={styles.chatingArea}>
                  <TextField
                    label="Message"
                    variant="standard"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    sx={{
                      width: "100%",
                      // 1. Text color you type
                      "& .MuiInputBase-input": {
                        color: "white",
                      },
                      // 2. Placeholder / Label color (normal)
                      "& .MuiInputLabel-root": {
                        color: "#9aa0a6",
                      },
                      // 3. Label color when clicked (focused)
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: "#8ab4f8",
                      },
                      // 4. Normal bottom underline
                      "& .MuiInput-underline:before": {
                        borderBottomColor: "rgba(255, 255, 255, 0.3)",
                      },
                      // 5. Hover bottom underline
                      "& .MuiInput-underline:hover:before": {
                        borderBottomColor: "white !important",
                      },
                      // 6. Active focused bottom underline
                      "& .MuiInput-underline:after": {
                        borderBottomColor: "#8ab4f8",
                      },
                    }}
                  />
                  <Button variant="outlined" onClick={sendMessage}>
                    Send
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
