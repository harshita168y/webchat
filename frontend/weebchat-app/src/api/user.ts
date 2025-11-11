import { fetchIdToken } from "../auth";
import { auth } from "../firebaseConfig";
import { API_BASE } from "../../src/config";

// const API_BASE = "https://localhost:5122/api"; // change if you host elsewhere
// const API_BASE = "http://10.0.2.2:5122/api";

export const syncUser = async () => {
  const token = await fetchIdToken();
  if (!token) throw new Error("User not authenticated.");

  const res = await fetch(`${API_BASE}/user/sync`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: auth.currentUser?.email ?? null,
    }),
  });

  if (!res.ok) throw new Error("Failed to sync user");
  const data = await res.json();
  console.log("✅ Synced user:", data);
  return data;
};

export async function setDisplayName(token: string, displayName: string) {
  const res = await fetch("http://localhost:5122/api/user/displayname", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ displayName }), // lowercase key here is important!
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Server error ${res.status}: ${text}`);
  }

  return res.json();
}
