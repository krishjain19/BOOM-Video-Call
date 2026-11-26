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
import EnterIntoLoby from "./EnterIntoLoby";

const server_url =
  window.location.hostname === "localhost" ? server.dev : server.prod;

var connections = {};

const peerConfigConnections = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelay",
      credential: "openrelay",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelay",
      credential: "openrelay",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelay",
      credential: "openrelay",
    },
  ],
};

export default function VideoMeetComponent() {
  const { url } = useParams();

  const sessionKey = url ? `meet_session_${url}` : "meet_session_room";

  const savedSession = (() => {
    try {
      const data = sessionStorage.getItem(sessionKey);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  })();

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

  let [askForUsername, setAskForUsername] = useState(
    savedSession?.inCall ? false : true
  );

  let [username, setUsername] = useState(savedSession?.username || "");

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
        videoAllowed = true;
        videoPermission.getTracks().forEach((track) => track.stop());
      } else {
        setVideoAvailable(false);
      }

      const audioPermission = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      if (audioPermission) {
        setAudioAvailable(true);
        audioAllowed = true;
        audioPermission.getTracks().forEach((track) => track.stop());
      } else {
        setAudioAvailable(false);
      }

      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }

      if (videoAllowed || audioAllowed) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoAllowed,
          audio: audioAllowed,
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

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!askForUsername) {
        event.preventDefault();
        event.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [askForUsername]);

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

    socketRef.current.off("signal");
    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.off("connect");
    socketRef.current.on("connect", () => {
      const room = (url ? `/${url}` : window.location.pathname).replace(
        /\/+$/,
        "",
      );
      socketRef.current.emit("join-call", room);
      socketIdref.current = socketRef.current.id;
    });

    socketRef.current.off("chat-Message");
    socketRef.current.on("chat-Message", addMessage);

    socketRef.current.off("userLeft");
    socketRef.current.on("userLeft", (id) => {
      setVideos((videos) => videos.filter((video) => video.socketId !== id));
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

  useEffect(() => {
    if (savedSession?.inCall && savedSession?.username) {
      getMedia();
    }
  }, []);

  let routeTo = useNavigate();

  let connect = () => {
    setAskForUsername(false);

    try {
      sessionStorage.setItem(
        sessionKey,
        JSON.stringify({ inCall: true, username: username.trim() })
      );
    } catch (e) {}

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
      sessionStorage.removeItem(sessionKey);
    } catch (e) {}

    try {
      let tracks = localVideoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    } catch (e) {}

    routeTo("/home");
  };

  return (
    <div>
      {askForUsername === true ? (
        <EnterIntoLoby
          username={username}
          setUsername={setUsername}
          connect={connect}
          localVideoRef={localVideoRef}
          video={video}
          audio={audio}
          handleVideo={handleVideo}
          handleAudio={handleAudio}
          url={url}
        />
      ) : (
        <div className={styles.meetVideoContainer}>
          <div className={styles.meetingContent}>
            {/* ── Control Bar ── */}
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

            {/* ── Self video: always bottom-right PiP ── */}
            <div className={styles.pipWrapper}>
              <video
                className={styles.meetUserVideo}
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{ transform: screen ? "none" : "scaleX(-1)" }}
              />
              <span className={styles.pipLabel}>You</span>
            </div>

            {/* ── Alone: dark waiting screen ── */}
            {videos.length === 0 ? (
              <div className={styles.soloView}>
                <div className={styles.soloLabel}>
                  Waiting for others to join...
                </div>
              </div>
            ) : videos.length === 1 ? (
              /* ── 1 Remote Participant: True Full Screen ── */
              <div className={styles.singleView}>
                <video
                  data-socket={videos[0].socketId}
                  ref={(ref) => {
                    if (ref && videos[0].stream) {
                      ref.srcObject = videos[0].stream;
                      ref
                        .play()
                        .catch((err) =>
                          console.log("Autoplay error:", err)
                        );
                    }
                  }}
                  autoPlay
                  playsInline
                />
              </div>
            ) : (
              /* ── 2+ Remote Participants: Dynamic Grid ── */
              <div
                className={styles.conferenceView}
                style={{
                  gridTemplateColumns:
                    videos.length <= 4
                      ? "repeat(2, 1fr)"
                      : videos.length <= 9
                      ? "repeat(3, 1fr)"
                      : "repeat(4, 1fr)",
                }}
              >
                {videos.map((video) => (
                  <div key={video.socketId}>
                    <video
                      data-socket={video.socketId}
                      ref={(ref) => {
                        if (ref && video.stream) {
                          ref.srcObject = video.stream;
                          ref
                            .play()
                            .catch((err) =>
                              console.log("Autoplay error:", err)
                            );
                        }
                      }}
                      autoPlay
                      playsInline
                    ></video>
                  </div>
                ))}
              </div>
            )}
          </div>

          {showModal && (
            <div className={styles.chatRoom}>
              <div className={styles.chatContainer}>
                {/* Chat Header with close button */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", paddingBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>Chat</h1>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: "1.3rem", lineHeight: 1, padding: "2px 6px" }}
                    title="Close chat"
                  >
                    ×
                  </button>
                </div>

                {/* Messages scroll area */}
                <div className={styles.chattingDisplay}>
                  {messages.length > 0 ? (
                    messages.map((item, index) => (
                      <div style={{ marginTop: "10px" }} key={index}>
                        <p style={{ fontWeight: "600", fontSize: "0.85rem", color: "#adb5bd", marginBottom: "2px" }}>
                          {item.sender}
                        </p>
                        <p style={{ fontSize: "0.9rem", color: "white", margin: 0 }}>{item.data}</p>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", marginTop: "12px" }}>No messages yet</p>
                  )}
                </div>

                {/* Message Input */}
                <div className={styles.chatingArea}>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { sendMessage(); } }}
                    placeholder="Type a message..."
                    style={{
                      flex: 1,
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: "4px",
                      color: "white",
                      padding: "8px 10px",
                      fontSize: "0.9rem",
                      outline: "none",
                    }}
                  />
                  <button
                    type="button"
                    onClick={sendMessage}
                    style={{
                      background: "#ff7b00",
                      border: "none",
                      borderRadius: "4px",
                      color: "white",
                      padding: "8px 14px",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
