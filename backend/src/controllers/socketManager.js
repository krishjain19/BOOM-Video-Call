import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};

export const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    // Join a call and receive its existing chat history.

    console.log("SOMETHING IS CONNECTED");

    socket.on("join-call", (path) => {
      if (connections[path] === undefined) {
        connections[path] = [];
      }

      // Prevent the same socket joining the same call twice.
      if (connections[path].includes(socket.id)) {
        return;
      }

      connections[path].push(socket.id);

      timeOnline[socket.id] = Date.now();

      // Notify every participant, including the joining user.
      for (const id of connections[path]) {
        io.to(id).emit("user-joined", socket.id, connections[path]);
      }

      // Replay previous messages to this socket only.
      if (messages[path] !== undefined) {
        for (let a = 0; a < messages[path].length; ++a) {
          io.to(socket.id).emit(
            "chat-messages",
            messages[path][a]["data"],
            messages[path][a]["sender"],
            messages[path][a]["socket-id-sender"],
          );
        }
      }
    });

    // Forward WebRTC signaling to a specified recipient.
    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });

    // Find the call containing this socket.
    socket.on("chat-messages", (data, sender) => {
      const [matchingRoom, found] = Object.entries(connections).reduce(
        ([room, isFound], [roomKey, roomValue]) => {
          if (!isFound && roomValue.includes(socket.id)) {
            return [roomKey, true];
          }

          return [room, isFound];
        },
        ["", false],
      );

      if (found === true) {
        if (messages[matchingRoom] === undefined) {
          messages[matchingRoom] = [];
        }

        messages[matchingRoom].push({
          "sender": sender,
          "data": data,
          "socket-id-sender": socket.id,
        });

        console.log("message", matchingRoom, ":", sender, data);

        // Send the new message to every participant
        connections[matchingRoom].forEach((elem) => {
          io.to(elem).emit("chat-message", data, sender, socket.id);
          io.to(elem).emit("chat-Message", data, sender, socket.id);
        });
      }
    });

    // Remove the socket from its call on disconnection.
    socket.on("disconnect", () => {
      var diffTime = Math.abs(timeOnline[socket.id] - new Date());
      // const durationSeconds = timeOnline[socket.id]
      // ? Math.floor((Date.now() - timeOnline[socket.id].getTime()) / 1000)
      // : 0;
      var key;

      for (const [k, v] of JSON.parse(
        JSON.stringify(Object.entries(connections)),
      )) {
        for (let a = 0; a < v.length; ++a) {
          if (v[a] === socket.id) {
            key = k;

            for (let a = 0; a < connections[key].length; ++a) {
              io.to(connections[key][a]).emit("user-left", socket.id);
              io.to(connections[key][a]).emit("userLeft", socket.id);
            }
            var index = connections[key].indexOf(socket.id);

            connections[key].splice(index, 1);

            if (connections[key].length === 0) {
              delete connections[key];
            }
          }
        }
      }
    });
  });

  return io;
};
