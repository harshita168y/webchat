import { Platform } from "react-native";

export const API_BASE =
  Platform.OS === "android"
    ? "http://10.54.97.25:5122/api" // special alias for localhost
    : "http://localhost:5122/api";

export const HUB_URL =
  Platform.OS === "android"
    // ? "http://10.0.2.2:5122/chatHub"
    ?  "http://10.0.2.2:5122/chatHub"
    : "http://localhost:5122/chatHub";
