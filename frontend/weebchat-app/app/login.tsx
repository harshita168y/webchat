import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { signInEmail, signUpEmail, signInAnon } from "../src/auth";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showSignup, setShowSignup] = useState(false);
  const [bgAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgAnim, {
          toValue: 1,
          duration: 6000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bgAnim, {
          toValue: 0,
          duration: 6000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleAnon = async () => {
    await signInAnon();
    router.replace("../tabs/username");
  };

  const handleLogin = async () => {
    await signInEmail(email, password);
    router.replace("../tabs/username");
  };

  const handleSignup = async () => {
    await signUpEmail(email, password);
    setShowSignup(false);
  };

  const glowTranslate = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.3, width * 0.3],
  });

  return (
    <View style={{ flex: 1, backgroundColor: "#0b0b12", overflow: "hidden" }}>
      {/* Animated Background */}
      <Animated.View
        style={{
          position: "absolute",
          width: width * 1.5,
          height: height * 1.5,
          top: -height * 0.25,
          left: glowTranslate,
          opacity: 0.4,
        }}
      >
        <LinearGradient
          colors={["#7c3aed", "#9333ea", "#e879f9"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </Animated.View>

      {/* Main Content */}
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <Text
          style={{
            color: "#a78bfa",
            fontSize: 34,
            fontWeight: "bold",
            marginBottom: 4,
            textShadowColor: "#9333ea",
            textShadowRadius: 10,
          }}
        >
          WeebChat
        </Text>
        <Text style={{ color: "#ccc", fontSize: 14, marginBottom: 32 }}>
          Connect with your clan
        </Text>

        {/* Anonymous */}
        <TouchableOpacity
          onPress={handleAnon}
          style={{
            backgroundColor: "#7c3aed",
            paddingVertical: 14,
            paddingHorizontal: 60,
            borderRadius: 12,
            marginBottom: 24,
            shadowColor: "#7c3aed",
            shadowOpacity: 0.7,
            shadowRadius: 10,
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
            Continue Anonymously
          </Text>
        </TouchableOpacity>

        {/* Email Login */}
        <View style={{ width: "100%", gap: 12 }}>
          <TextInput
            placeholder="Email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            style={{
              backgroundColor: "#1a1a25",
              color: "white",
              padding: 14,
              borderRadius: 10,
            }}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{
              backgroundColor: "#1a1a25",
              color: "white",
              padding: 14,
              borderRadius: 10,
            }}
          />

          <TouchableOpacity
            onPress={handleLogin}
            style={{
              backgroundColor: "#7c3aed",
              paddingVertical: 14,
              borderRadius: 10,
              marginTop: 4,
              shadowColor: "#7c3aed",
              shadowOpacity: 0.6,
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

          <Text
            style={{
              color: "#aaa",
              textAlign: "center",
              marginTop: 16,
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
      </View>

      {/* Signup Modal */}
      <Modal visible={showSignup} animationType="fade" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.85)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "#1a1a25",
              padding: 24,
              borderRadius: 12,
              width: "85%",
              borderWidth: 1,
              borderColor: "#7c3aed",
              shadowColor: "#7c3aed",
              shadowOpacity: 0.8,
              shadowRadius: 10,
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
