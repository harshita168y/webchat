// src/api/user.ts
export async function setDisplayName(token: string, displayName: string) {
  const res = await fetch("http://10.0.2.2:5122/api/user/displayname", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ displayName }), //lowercase key here is important!
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Server error ${res.status}: ${text}`);
  }

  return res.json();
}
