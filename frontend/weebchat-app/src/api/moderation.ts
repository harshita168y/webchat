
const API_BASE = "http://localhost:5122/api";

export async function moderateMessage(content: string, context: string = "") {
  try {
    const response = await fetch(`${API_BASE}/moderation/evaluate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Content: content,
        Context: context,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("❌ Moderation API returned:", response.status, errText);
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data; // { isFlagged, category, score, reason }
  } catch (err) {
    console.error("⚠️ Moderation API failed:", err);
    return { isFlagged: false, category: "error", reason: "moderation failed" };
  }
}
