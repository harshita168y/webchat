import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList } from "react-native";
import {
  connectToHub,
  joinRoom,
  sendMessage,
  leaveRoom,
  disconnect,
  isConnected,
} from "../../src/api/chatHub"; // make sure chatHub exports isConnected()
import { auth } from "../../src/firebaseConfig";
import { useLocalSearchParams } from "expo-router";

// Define message type at the top (cleaner)
type ChatMessage = {
  id?: number;
  chatRoomId?: string;
  senderUid?: string;
  content: string;
  sentAt?: string;
  system?: boolean;
  senderName?: string;
};

export default function ChatRoomScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false); // track connection
  // const roomId = "1"; // later make dynamic
  const { id } = useLocalSearchParams();
  const roomId = id?.toString() ?? "1"; // fallback for safety
  // Safer send function
  
  const handleSend = async () => {
    if (!input.trim()) return;

    if (!isConnected()) {
      console.warn("❌ Cannot send message — hub not connected yet!");
      return;
    }
    console.log("Sending message to room:", roomId, "message:", input);

    await sendMessage(roomId, input);
    setInput("");
  };
    useEffect(() => {
    if (!roomId) return;

    setMessages([]); // clear previous room messages

    connectToHub(
      (msg: any) => setMessages((prev) => [...prev, msg]),
      (sys: string) =>
      setMessages((prev) => [
        ...prev,
        {
          content: sys,
          senderName: "System",
          sentAt: new Date().toISOString(),
        },
      ])

    ).then(() => joinRoom(roomId));

    return () => {
      leaveRoom(roomId);
      disconnect();
    };
  }, [roomId]); //  rerun whenever roomId changes


  return (
    <View style={{ flex: 1, backgroundColor: "#0d0d14", padding: 16 }}>
      {/*  Connection status */}
      <Text
        style={{
          color: connected ? "#22c55e" : "#f97316",
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        {connected ? "🟢 Connected" : "🟠 Reconnecting..."}
      </Text>

      {/*  Message list */}
      <FlatList
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View
            style={{
              alignSelf:
                item.senderUid === auth.currentUser?.uid ? "flex-end" : "flex-start",
              backgroundColor:
                item.senderUid === auth.currentUser?.uid ? "#7c3aed" : "#1f1f2e",
              padding: 10,
              borderRadius: 12,
              marginVertical: 4,
              maxWidth: "75%",
            }}
          >
            {!item.system && (
              <Text
                style={{
                  fontSize: 12,
                  color: "#a1a1aa",
                  marginBottom: 2,
                }}
              >
                {item.senderName || "Anonymous"}
              </Text>
            )}
            <Text style={{ color: "#fff", fontSize: 15 }}>
              {item.system ? `💬 ${item.content}` : item.content}
            </Text>
          </View>
        )}
      />


      {/*  Input & send button */}
      <View style={{ flexDirection: "row", marginTop: "auto" }}>
        <TextInput
          style={{
            flex: 1,
            backgroundColor: "#1a1a25",
            color: "#fff",
            padding: 12,
            borderRadius: 8,
          }}
          placeholder="Type a message..."
          placeholderTextColor="#888"
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity
          onPress={handleSend}
          style={{
            backgroundColor: "#7c3aed",
            padding: 14,
            borderRadius: 10,
            marginLeft: 8,
          }}
        >
          <Text style={{ color: "#fff" }}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
}
