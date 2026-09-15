import { Server } from "socket.io";

let io = null;
let snapshotBuilder = null;
let inFlight = null;
let pending = false;

export function initSocket(server, origins) {
  io = new Server(server, {
    cors: {
      origin: origins,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });

    socket.on("request:snapshot", async () => {
      if (!snapshotBuilder) return;
      try {
        socket.emit("snapshot", await snapshotBuilder());
      } catch (error) {
        console.error("request:snapshot error:", error);
      }
    });
  });

  return io;
}

export function setSnapshotBuilder(builder) {
  snapshotBuilder = builder;
}

export function getIO() {
  return io;
}

export async function broadcastSnapshot() {
  if (!io || !snapshotBuilder) return;

  if (inFlight) {
    pending = true;
    return;
  }

  const run = async () => {
    do {
      pending = false;
      try {
        io.emit("snapshot", await snapshotBuilder());
      } catch (error) {
        console.error("broadcastSnapshot error:", error);
      }
    } while (pending);
  };

  inFlight = run().finally(() => {
    inFlight = null;
  });

  return inFlight;
}