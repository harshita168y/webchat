import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Dimensions,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { auth } from "../../src/firebaseConfig";
import { getIdToken } from "firebase/auth";
import { LinearGradient } from "expo-linear-gradient";
import { API_BASE } from "../../src/config";
const screenWidth = Dimensions.get("window").width;
export default function RoomsScreen() {
  const router = useRouter();
  const [rooms, setRooms] = useState<any[]>([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchRooms = async () => {
    try {
      const token = await getIdToken(auth.currentUser!, true);
      const res = await fetch(`${API_BASE}/chat/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRooms(data);
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async () => {
    if (!newRoomName.trim()) return;
    try {
      const token = await getIdToken(auth.currentUser!, true);
      const res = await fetch(`${API_BASE}/chat/create-room`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roomName: newRoomName }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setNewRoomName("");
      setModalVisible(false);
      fetchRooms();
    } catch (err) {
      console.error("Failed to create room:", err);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  return (
    <LinearGradient
      colors={["#1a0b2e", "#2e1065", "#1a0b2e"]}
      style={{ flex: 1, padding: 20, justifyContent: "center", alignItems: "center" }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Neon cross background lines */}
      <View
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
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
            backgroundColor: "rgba(124, 58, 237, 0.25)",
            transform: [{ rotate: "45deg" }],
          }}
        />
        <View
          style={{
            position: "absolute",
            width: "150%",
            height: 2,
            backgroundColor: "rgba(124, 58, 237, 0.25)",
            transform: [{ rotate: "-45deg" }],
          }}
        />
      </View>

      {/* Main container */}
      <View
        style={{
          backgroundColor: "rgba(15,15,25,0.85)",
          borderRadius: 20,
          padding: 20,
          shadowColor: "#7c3aed",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 20,
          width: "100%",
          flex: 1,
        }}
      >
        {/* Header with Create button */}
        <View
  style={{
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  }}
>
  {/* Home Button */}
  <TouchableOpacity
    onPress={() => router.replace("/")}
    style={{
      backgroundColor: "#1a1a25",
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      shadowColor: "#7c3aed",
      shadowOpacity: 0.6,
      shadowRadius: 10,
    }}
  >
    <Text
      style={{
        color: "#c084fc",
        fontWeight: "bold",
        fontSize: 16,
      }}
    >
      🏠
    </Text>
  </TouchableOpacity>

  {/* Title */}
  <Text
    style={{
      color: "white",
      fontSize: 22,
      fontWeight: "bold",
      textShadowColor: "#7c3aed",
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 10,
    }}
  >
    Available Chat Rooms
  </Text>

  {/* + Create button */}
  <TouchableOpacity
    onPress={() => setModalVisible(true)}
    style={{
      backgroundColor: "#7c3aed",
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
      shadowColor: "#a855f7",
      shadowOpacity: 0.8,
      shadowRadius: 10,
    }}
  >
    <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>+ Create</Text>
  </TouchableOpacity>
</View>


        {loading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color="#a855f7" />
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
              paddingBottom: 20,
            }}
            showsVerticalScrollIndicator={false}
          >
            {rooms.length > 0 ? (
              rooms.map((room) => (
                <TouchableOpacity
                  key={room.id}
                  activeOpacity={0.9}
                  onPress={() => router.push(`/chatroom/${room.id}`)}
                  style={{
                    backgroundColor: "#1a1a25",
                    width: (screenWidth - 70) / 2,
                    padding: 16,
                    borderRadius: 14,
                    marginBottom: 18,
                    borderWidth: 1,
                    borderColor: "#3b2f5f",
                    shadowColor: "#7c3aed",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.4,
                    shadowRadius: 10,
                  }}
                >
                  <Text
                    style={{
                      color: "#d8b4fe",
                      fontSize: 18,
                      fontWeight: "700",
                      textShadowColor: "#7c3aed",
                      textShadowOffset: { width: 0, height: 0 },
                      textShadowRadius: 8,
                    }}
                    numberOfLines={1}
                  >
                    {room.roomName}
                  </Text>
                  <Text
                    style={{
                      color: "#9ca3af",
                      fontSize: 11,
                      marginTop: 4,
                    }}
                    numberOfLines={2}
                  >
                    🕒 {new Date(room.createdAt).toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text
                style={{
                  color: "#aaa",
                  textAlign: "center",
                  marginTop: 20,
                  fontSize: 14,
                }}
              >
                No rooms yet — create one 👆
              </Text>
            )}
          </ScrollView>
        )}
      </View>

      {/* Modal for creating new room */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <LinearGradient
            colors={["#1f0936", "#3b0764"]}
            style={{
              width: "80%",
              padding: 24,
              borderRadius: 16,
              shadowColor: "#7c3aed",
              shadowOpacity: 0.8,
              shadowRadius: 20,
            }}
          >
            <Text
              style={{
                color: "#e0e0ff",
                fontSize: 20,
                fontWeight: "700",
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              Create a New Chat Room
            </Text>

            <TextInput
              placeholder="Enter room name"
              placeholderTextColor="#aaa"
              value={newRoomName}
              onChangeText={setNewRoomName}
              style={{
                backgroundColor: "#1a1a25",
                color: "white",
                padding: 12,
                borderRadius: 10,
                borderColor: "#7c3aed",
                borderWidth: 1,
                marginBottom: 20,
              }}
            />

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{
                  flex: 1,
                  backgroundColor: "#333",
                  paddingVertical: 12,
                  borderRadius: 10,
                  marginRight: 10,
                }}
              >
                <Text
                  style={{
                    color: "#ccc",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={createRoom}
                style={{
                  flex: 1,
                  backgroundColor: "#7c3aed",
                  paddingVertical: 12,
                  borderRadius: 10,
                  shadowColor: "#a855f7",
                  shadowOpacity: 0.6,
                  shadowRadius: 10,
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  Create
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </LinearGradient>
  );
}
