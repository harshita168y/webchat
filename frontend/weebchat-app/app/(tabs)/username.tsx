import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { getIdToken } from "firebase/auth";
import { auth } from "../../src/firebaseConfig";
import { setDisplayName } from "../../src/api/user"; // uses your backend helper

export default function UsernameScreen() {
  const [username, setUsername] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // clear state when unmounting or switching screens
  useEffect(() => {
    return () => {
      setUsername("");
      setSaved(null);
      setError(null);
    };
  }, []);

  // Save username to backend
  const saveName = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not signed in");

      const token = await getIdToken(user, true);
      const result = await setDisplayName(token, username.trim());
      setSaved(result.displayName);
    } catch (err: any) {
      console.error("❌ Failed to save username:", err);
      setError(err.message || "Failed to save username");
    } finally {
      setLoading(false);
    }
  };

  // Navigation after saving
  const goTo = (path: string) => {
    setUsername("");
    setSaved(null);
    router.replace(path as any);
  };

  return (
    <LinearGradient
      colors={["#1a0b2e", "#2e1065", "#1a0b2e"]}
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View
        style={{
          backgroundColor: "rgba(15,15,25,0.85)",
          padding: 30,
          borderRadius: 20,
          width: "85%",
          shadowColor: "#7c3aed",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 20,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: "#e0e0ff",
            fontSize: 22,
            fontWeight: "700",
            marginBottom: 20,
            textShadowColor: "#7c3aed",
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 8,
          }}
        >
          {saved ? `Heyy ${saved}! 👋` : "Set Your Username"}
        </Text>

        <TextInput
          placeholder="Enter username"
          placeholderTextColor="#aaa"
          value={username}
          onChangeText={setUsername}
          style={{
            backgroundColor: "#1a1a25",
            color: "white",
            padding: 12,
            borderRadius: 10,
            width: "100%",
            marginBottom: 14,
          }}
        />

        <TouchableOpacity
          onPress={saveName}
          disabled={loading || !username.trim()}
          style={{
            backgroundColor: loading ? "#5b21b6" : "#7c3aed",
            paddingVertical: 14,
            borderRadius: 10,
            width: "100%",
            marginBottom: 12,
            opacity: loading ? 0.8 : 1,
          }}
        >
          <Text
            style={{
              color: "white",
              textAlign: "center",
              fontWeight: "bold",
              fontSize: 16,
            }}
          >
            {loading ? "Saving..." : "Save Username"}
          </Text>
        </TouchableOpacity>

        {error && (
          <Text
            style={{
              color: "#f87171",
              marginBottom: 10,
              textAlign: "center",
              fontSize: 14,
            }}
          >
            {error}
          </Text>
        )}

        {/* 🚪 Navigation Buttons */}
        <TouchableOpacity onPress={() => goTo("/chatroom")}>
          <Text
            style={{
              textAlign: "center",
              fontSize: 16,
              marginTop: 16,
              color: "#c084fc",
              textShadowColor: "#7c3aed",
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 8,
              fontWeight: "600",
              lineHeight: 26,
            }}
          >
            {/* Chat with a random stranger → */}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => goTo("/rooms")}>
          <Text
            style={{
              textAlign: "center",
              fontSize: 16,
              color: "#d8b4fe",
              fontWeight: "700",
              textShadowColor: "#a855f7",
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 10,
              marginTop: 10,
            }}
          >
            ⚡ Explore Clans →
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
