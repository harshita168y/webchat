import * as SignalR from "@microsoft/signalr";
import { getIdToken } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { Platform } from "react-native";
import { moderateMessage } from "./moderation";


// const HUB_URL = "http://localhost:5122/hubs/chat"; // adjust for your env
// const API_BASE =
//   Platform.OS === "android"
//     ? "http://10.54.97.25:5122/api"
//     : "http://localhost:5122/api";
// 🟣 REST APIs still use /api/... but SignalR hub is separate
const HUB_URL =
  Platform.OS === "android"
    ? "http://10.10.14.2:5122/hubs/chat" // 
    : "http://localhost:5122/hubs/chat";


let connection: SignalR.HubConnection | null = null;
let isStopping = false;

export async function connectToHub(
  onReceive: (msg: any) => void,
  onSystem?: (msg: string) => void
) {
  // If a connection already exists, reuse it
  if (connection && connection.state === SignalR.HubConnectionState.Connected) {
    console.log("⚡ Already connected to SignalR hub");
    return;
  }

  const token = await getIdToken(auth.currentUser!, true);

  connection = new SignalR.HubConnectionBuilder()
    .withUrl(HUB_URL,{
    accessTokenFactory: async () => await getIdToken(auth.currentUser!)
  })
    .configureLogging(SignalR.LogLevel.Information)
    .withAutomaticReconnect()
    .build();

    await connection.start();
console.log("✅ SignalR connected");

// expose to console for manual tests
(window as any).connection = connection;

  connection.on("ReceiveMessage", onReceive);
  connection.on("SystemMessage", onSystem || (() => {}));

  connection.onclose((error) => {
    if (error) console.warn("❌ SignalR connection closed:", error.message);
    else console.log("🔌 SignalR connection closed gracefully.");
  });

  connection.onreconnecting((err) => {
    console.warn("⚠️ Reconnecting to SignalR hub...", err?.message);
  });

  connection.onreconnected(() => {
    console.log("✅ Reconnected to SignalR hub.");
  });
 console.log("✅ SignalR connection state:", connection.state);
}

export async function joinRoom(roomId: string) {
  if (!connection || connection.state !== SignalR.HubConnectionState.Connected) return;
  try {
    await connection.invoke("JoinRoom", roomId);
    console.log(`🚪 Joined room ${roomId}`);
  } catch (err) {
    console.error("❌ JoinRoom failed:", err);
  }
}

export async function leaveRoom(roomId: string) {
  if (!connection || connection.state !== SignalR.HubConnectionState.Connected) return;
  try {
    await connection.invoke("LeaveRoom", roomId);
    console.log(`🚪 Left room ${roomId}`);
  } catch (err) {
    console.warn("⚠️ LeaveRoom failed:", err);
  }
}

export async function sendMessage(
  roomId: string,
  content: string,
  onLocalSystem?: (msg: string) => void
) {
  
  if (!connection || connection.state !== SignalR.HubConnectionState.Connected) {
    console.warn("⚠️ Tried to send while disconnected — ignored.");
    return;
  }

  try {
    
    // Step 1: Client-side moderation (lightweight check)
    const moderation = await moderateMessage(content);
    

    if (moderation.flagged) {
      console.warn(
        `🚫 Local moderation flagged → ${moderation.category} (${moderation.reason})`
      );

      // Show a local warning message in the chat UI
      if (onLocalSystem) {
        onLocalSystem(
          `⚠️ Your message *may* violate chat policy (${moderation.category}).`
        );
      }

      // IMPORTANT: still send to backend for official moderation + logging
      console.log("📤 Sending flagged message to backend for verification...");
    }

    // Step 2: Always send to backend (this is where logs + bans are handled)
    await connection.invoke("SendMessage", roomId, content);
    console.log("✅ Message sent to backend successfully.");
  } 
  catch (err: any) {
    console.error("❌ Error sending message:", err);
    if (onLocalSystem) {
      onLocalSystem(`❌ Error sending message: ${err.message}`);
    }
  }
}


export async function disconnect() {
  if (!connection) return;
  if (isStopping) return; // prevent multiple stops

  isStopping = true;
  try {
    if (connection.state !== SignalR.HubConnectionState.Disconnected) {
      await connection.stop();
      console.log("🔌 Disconnected SignalR hub");
    }
  } catch (err: any) {
    const msg = err?.message ?? "";
    if (!msg.includes("underlying connection")) {
      console.error("⚠️ Disconnect error:", err);
    }
  } finally {
    isStopping = false;
    connection = null;
  }
}

export function isConnected() {
  return connection?.state === SignalR.HubConnectionState.Connected;
}
