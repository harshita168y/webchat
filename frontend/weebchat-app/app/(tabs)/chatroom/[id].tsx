import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { auth } from "../../../src/firebaseConfig";
import { getIdToken } from "firebase/auth";
import {
  connectToHub,
  joinRoom,
  leaveRoom,
  disconnect,
  sendMessage,
} from "../../../src/api/chatHub";
import ReportModal from "../../../src/components/ReportModal";
import { moderateMessage } from "../../../src/api/moderation"; 

type ChatMessage = {
  id?: number;
  roomId?: string | number;
  content: string;
  senderUid?: string;
  senderName?: string;
  sentAt?: string;
  system?: boolean;
};

const API_BASE =
  Platform.OS === "android"
    ? "http://10.54.97.25:5122/api"
    : "http://localhost:5122/api"; //localhost change it later to prod

const screenHeight = Dimensions.get("window").height;

export default function ChatRoomScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const roomId = Array.isArray(id) ? id[0] : id ?? "";

  const [reportVisible, setReportVisible] = useState(false);
  const [targetMessageId, setTargetMessageId] = useState<number | string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isTyping, setIsTyping] = useState(false);
  const [roomName, setRoomName] = useState<string>("");

  // Open report modal
  const openReport = (messageId: number | string) => {
    setTargetMessageId(messageId);
    setReportVisible(true);
  };

  // Submit report to backend
  const submitReport = async (reason: string, details?: string) => {
    if (!targetMessageId) throw new Error("No message");
    const token = await getIdToken(auth.currentUser!, true);
    const res = await fetch(`${API_BASE}/moderation/report`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messageId: targetMessageId,
        reason,
        details,
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`HTTP ${res.status}: ${txt}`);
    }
    setReportVisible(false);
  };

  // --- utility ---
  const waitForAuth = async () => {
    while (!auth.currentUser) await new Promise((r) => setTimeout(r, 150));
  };

  const fetchHistory = async (rid: string) => {
    try {
      const token = await getIdToken(auth.currentUser!, true);
      const res = await fetch(`${API_BASE}/chat/messages/${rid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ChatMessage[] = await res.json();
      setMessages(data);
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  // fetch actual room name from backend
  const fetchRoomName = async (rid: string) => {
    try {
      const token = await getIdToken(auth.currentUser!, true);
      const res = await fetch(`${API_BASE}/chat/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const room = data.find(
        (r: any) =>
          r.id?.toString() === rid.toString() ||
          r.roomId?.toString() === rid.toString()
      );

      if (room?.roomName || room?.name) {
        setRoomName(room.roomName || room.name);
      } else {
        setRoomName(`Room #${rid}`);
      }
    } catch (err) {
      console.error("⚠️ Failed to fetch room name:", err);
      setRoomName(`Room #${rid}`);
    }
  };

  // --- SignalR setup ---
  useEffect(() => {
    let alive = true;

    const run = async () => {
      if (!roomId) return;
      setMessages([]);
      await waitForAuth();
      await fetchRoomName(roomId);
      await fetchHistory(roomId);

      await connectToHub(
        (msg: ChatMessage) => {
          if (!alive) return;
          if (msg.senderUid === auth.currentUser?.uid) return;
          if (!msg.roomId || msg.roomId.toString() === roomId.toString()) {
            setMessages((prev) => [...prev, msg]);
          }
        },
        (sys: string) => {
          if (!alive) return;
          setMessages((prev) => [...prev, { content: sys, system: true }]);
        }
      );

      await joinRoom(roomId);
    };

    run();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    return () => {
      alive = false;
      if (roomId) leaveRoom(roomId);
      setTimeout(() => disconnect(), 150);
      disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  
const handleSend = async () => {
  if (!input.trim() || !roomId) return;

  try {
    // ✅ Step 1: Run moderation before sending
    const moderation = await moderateMessage(input);

    if (moderation.isFlagged) {
      console.warn("🚫 Message blocked by AI:", moderation.reason);

      // Optional: show visual feedback to user
       alert(
        `⚠️ This message may violate chat policy (${moderation.category}).\n` +
        `It will still be sent for review.`
      );

      setInput(""); // clear the input field
     // return; // stop message from being sent
    }

    // ✅ Step 2: Only send if clean
    await sendMessage(roomId, input);

    setMessages((prev) => [
      ...prev,
      {
        content: input,
        senderUid: auth.currentUser?.uid,
        senderName: "You",
        sentAt: new Date().toISOString(),
      },
    ]);
    setInput("");
  } catch (err) {
    console.error("Send failed:", err);
  }
};

  // --- UI ---
  return (
    <LinearGradient
      colors={["#1a0b2e", "#2e1065", "#1a0b2e"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      {/* Neon Cross Lines */}
      <View
        style={{
          position: "absolute",
          width: "100%",
          height: screenHeight,
          justifyContent: "center",
          alignItems: "center",
        }}
        pointerEvents="none"
      >
        <View
          style={{
            position: "absolute",
            width: "150%",
            height: 2,
            backgroundColor: "rgba(124,58,237,0.25)",
            transform: [{ rotate: "45deg" }],
          }}
        />
        <View
          style={{
            position: "absolute",
            width: "150%",
            height: 2,
            backgroundColor: "rgba(124,58,237,0.25)",
            transform: [{ rotate: "-45deg" }],
          }}
        />
      </View>

      <Animated.View
        style={{
          flex: 1,
          padding: 16,
          opacity: fadeAnim,
        }}
      >
        {/* Header */}
        <View
          style={{
            alignItems: "center",
            marginBottom: 6,
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: "#c084fc",
              fontSize: 20,
              fontWeight: "bold",
              textShadowColor: "#7c3aed",
              textShadowRadius: 10,
              textAlign: "center",
            }}
          >
            {roomName || `Room #${roomId}`}
          </Text>

          {/* Exit Button */}
          <TouchableOpacity
            onPress={() => router.replace("/rooms")}
            style={{
              position: "absolute",
              right: 0,
              backgroundColor: "rgba(124,58,237,0.25)",
              borderRadius: 10,
              paddingVertical: 6,
              paddingHorizontal: 14,
              borderWidth: 1,
              borderColor: "#a855f7",
              shadowColor: "#c084fc",
              shadowOpacity: 0.7,
              shadowRadius: 8,
            }}
          >
            <Text
              style={{
                color: "#d8b4fe",
                fontWeight: "600",
                fontSize: 14,
              }}
            >
              Exit
            </Text>
          </TouchableOpacity>
        </View>

        {isTyping && (
          <Text
            style={{
              color: "#a78bfa",
              fontStyle: "italic",
              fontSize: 13,
              marginTop: 4,
              textAlign: "center",
            }}
          >
            Someone is typing...
          </Text>
        )}

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1, marginBottom: 10 }}
          contentContainerStyle={{ paddingVertical: 10 }}
        >
          {messages.map((m, i) => {
            const isMine = m.senderUid === auth.currentUser?.uid;
            const isSystem = !!m.system;
            const displayName = m.senderName || "Anonymous Weeb";
            const avatarLetter = displayName.charAt(0).toUpperCase();

            if (isSystem) {
              const isModeration = m.content?.includes("⚠️ Message blocked by moderation");

              return (
                <View
                  key={`sys-${i}`}
                  style={{
                    alignSelf: "center",
                    backgroundColor: isModeration
                      ? "rgba(255, 0, 80, 0.15)"
                      : "transparent",
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    marginVertical: 6,
                  }}
                >
                  <Text
                    style={{
                      color: isModeration ? "#ff6b9a" : "#aaa",
                      fontStyle: "italic",
                      fontSize: 13,
                      textAlign: "center",
                    }}
                  >
                    {m.content}
                  </Text>
                </View>
              );
            }


            return (
    <TouchableOpacity
      key={`msg-${i}`}
      activeOpacity={0.9}
      onLongPress={() => openReport(m.id!)} // mobile long-press
      {...(Platform.OS === "web"
        ? {
            // @ts-ignore → ignore TS since RN web supports this event
            onContextMenu: (e: any) => {
              e.preventDefault();
              openReport(m.id!);
            },
          }
        : {})}
      style={{
        flexDirection: isMine ? "row-reverse" : "row",
        alignItems: "flex-end",
        marginVertical: 6,
      }}
    >
      {/* Avatar bubble */}
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: isMine ? "#7c3aed33" : "#7c3aed22",
          borderWidth: 1,
          borderColor: "#7c3aed",
          alignItems: "center",
          justifyContent: "center",
          marginHorizontal: 6,
        }}
      >
        <Text style={{ color: "#c084fc", fontWeight: "bold" }}>
          {avatarLetter}
        </Text>
      </View>

    {/* Message bubble */}
    <View
      style={{
        alignSelf: isMine ? "flex-end" : "flex-start",
        backgroundColor: isMine ? "#7c3aed" : "#1a1a25",
        padding: 10,
        borderRadius: 12,
        maxWidth: "75%",
      }}
    >
      {!isMine && (
        <Text
          style={{
            color: "#a78bfa",
            fontSize: 12,
            marginBottom: 2,
          }}
        >
          {displayName}
        </Text>
      )}
      <Text style={{ color: "white", fontSize: 15 }}>{m.content}</Text>
    </View>
  </TouchableOpacity>
);

          })}
        </ScrollView>

        {/* Input bar */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "rgba(15,15,25,0.9)",
              borderRadius: 14,
              padding: 8,
              marginTop: 8,
            }}
          >
            <TextInput
              placeholder="Type a message..."
              placeholderTextColor="#888"
              value={input}
              onChangeText={setInput}
              style={{
                flex: 1,
                backgroundColor: "#1a1a25",
                color: "white",
                padding: 12,
                borderRadius: 10,
                fontSize: 15,
              }}
            />
            <TouchableOpacity
              onPress={handleSend}
              style={{
                backgroundColor: "#7c3aed",
                paddingVertical: 14,
                paddingHorizontal: 20,
                borderRadius: 10,
                marginLeft: 8,
                shadowColor: "#a855f7",
                shadowOpacity: 0.8,
                shadowRadius: 10,
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>Send</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>

      {/* Report Modal */}
      <ReportModal
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        onSubmit={submitReport}
      />
    </LinearGradient>
  );
}
