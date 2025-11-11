import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { signInEmail, signUpEmail, signInAnon } from "../../src/auth";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

// Neon Background Lines Component
const NeonLines = () => {
  const glow1 = useRef(new Animated.Value(0.6)).current;
  const glow2 = useRef(new Animated.Value(0.3)).current;
  const move1 = useRef(new Animated.Value(0)).current;
  const move2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow1, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(glow1, { toValue: 0.5, duration: 2000, useNativeDriver: false }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glow2, { toValue: 0.8, duration: 2200, useNativeDriver: false }),
        Animated.timing(glow2, { toValue: 0.3, duration: 2200, useNativeDriver: false }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(move1, { toValue: 30, duration: 4000, useNativeDriver: false }),
        Animated.timing(move1, { toValue: -30, duration: 4000, useNativeDriver: false }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(move2, { toValue: -20, duration: 5000, useNativeDriver: false }),
        Animated.timing(move2, { toValue: 20, duration: 5000, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  return (
    <View
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <Animated.View
        style={{
          position: "absolute",
          width: 2,
          height: "170%",
          top: move1,
          left: "25%",
          transform: [{ rotate: "25deg" }],
          backgroundColor: "#a78bfa",
          opacity: glow1,
          shadowColor: "#a78bfa",
          shadowOpacity: 1,
          shadowRadius: 25,
        }}
      />
      <Animated.View
        style={{
          position: "absolute",
          width: 2,
          height: "170%",
          top: move2,
          left: "70%",
          transform: [{ rotate: "-25deg" }],
          backgroundColor: "#7c3aed",
          opacity: glow2,
          shadowColor: "#7c3aed",
          shadowOpacity: 1,
          shadowRadius: 25,
        }}
      />
    </View>
  );
};

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showSignup, setShowSignup] = useState(false);

  // Navigation Logic
  const handleAnon = async () => {
    try {
      await signInAnon();
      router.replace("/username");
    } catch (err) {
      console.error("Anon sign-in failed:", err);
    }
  };

  const handleLogin = async () => {
    try {
      await signInEmail(email, password);
      router.replace("/rooms"); // goes to room list
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const handleSignup = async () => {
    try {
      await signUpEmail(email, password);
      setShowSignup(false);
      router.replace("/username"); // goes to username page after signup
    } catch (err) {
      console.error("Signup failed:", err);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0a0a13",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Background Gradient */}
      <LinearGradient
        colors={["#3b0764", "#1a1027", "#0a0a13"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          position: "absolute",
          width: width * 1.5,
          height: "100%",
        }}
      />

      {/* Animated Neon Lines */}
      <NeonLines />

      {/* Login Card */}
      <View
        style={{
          width: "85%",
          maxWidth: 420,
          padding: 28,
          backgroundColor: "rgba(26, 26, 37, 0.9)",
          borderRadius: 20,
          borderWidth: 1,
          borderColor: "#2f174a",
          shadowColor: "#7c3aed",
          shadowOpacity: 0.5,
          shadowRadius: 30,
          elevation: 12,
          zIndex: 2,
        }}
      >
        <Text
          style={{
            color: "#a78bfa",
            fontSize: 34,
            fontWeight: "bold",
            textAlign: "center",
            textShadowColor: "#7c3aed",
            textShadowRadius: 10,
            marginBottom: 6,
          }}
        >
          Chatzzz
        </Text>

        <Text style={{ color: "#ccc", textAlign: "center", marginBottom: 28 }}>
          Connect with your clan
        </Text>

        {/* Continue Anon */}
        <TouchableOpacity
          onPress={handleAnon}
          style={{
            backgroundColor: "#7c3aed",
            paddingVertical: 14,
            borderRadius: 12,
            shadowColor: "#7c3aed",
            shadowOpacity: 0.7,
            shadowRadius: 10,
            marginBottom: 24,
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
            Continue Anonymously
          </Text>
        </TouchableOpacity>

        {/* Email Fields */}
        <TextInput
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          style={{
            backgroundColor: "#151521",
            color: "white",
            padding: 14,
            borderRadius: 10,
            marginBottom: 12,
          }}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{
            backgroundColor: "#151521",
            color: "white",
            padding: 14,
            borderRadius: 10,
            marginBottom: 16,
          }}
        />

        {/* Sign In */}
        <TouchableOpacity
          onPress={handleLogin}
          style={{
            backgroundColor: "#7c3aed",
            paddingVertical: 14,
            borderRadius: 10,
            shadowColor: "#7c3aed",
            shadowOpacity: 0.5,
            shadowRadius: 8,
          }}
        >
          <Text
            style={{
              color: "white",
              textAlign: "center",
              fontWeight: "600",
              fontSize: 16,
            }}
          >
            Sign In
          </Text>
        </TouchableOpacity>

        {/* Sign Up Link */}
        <Text
          style={{
            color: "#aaa",
            textAlign: "center",
            marginTop: 18,
            fontSize: 14,
          }}
        >
          Don’t have an account?{" "}
          <Text
            style={{ color: "#a78bfa", fontWeight: "600" }}
            onPress={() => setShowSignup(true)}
          >
            Sign up
          </Text>
        </Text>
      </View>

      {/* Sign Up Modal */}
      <Modal visible={showSignup} animationType="fade" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(5, 5, 15, 0.95)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <NeonLines />

          <View
            style={{
              backgroundColor: "#1a1a25f5",
              padding: 24,
              borderRadius: 12,
              width: "85%",
              borderWidth: 1,
              borderColor: "#7c3aed",
              shadowColor: "#7c3aed",
              shadowOpacity: 0.8,
              shadowRadius: 10,
              zIndex: 2,
            }}
          >
            <Text
              style={{
                color: "#a78bfa",
                fontSize: 20,
                fontWeight: "bold",
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              Create Account
            </Text>

            <TextInput
              placeholder="Email"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              style={{
                backgroundColor: "#0d0d14",
                color: "white",
                padding: 12,
                borderRadius: 8,
                marginBottom: 10,
              }}
            />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={{
                backgroundColor: "#0d0d14",
                color: "white",
                padding: 12,
                borderRadius: 8,
                marginBottom: 16,
              }}
            />

            <TouchableOpacity
              onPress={handleSignup}
              style={{
                backgroundColor: "#7c3aed",
                padding: 14,
                borderRadius: 10,
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  color: "white",
                  textAlign: "center",
                  fontWeight: "bold",
                }}
              >
                Create Account
              </Text>
            </TouchableOpacity>

            <Pressable onPress={() => setShowSignup(false)}>
              <Text style={{ color: "#888", textAlign: "center" }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
