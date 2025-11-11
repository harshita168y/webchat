# 🧠Chatzzz – AI-Moderated Anime Community Chat

Chatzzz is a real-time, AI-powered group chat platform built for anime communities.  
It blends **SignalR** for live conversations, **OpenAI-driven contextual moderation**, and **intelligent violation tracking** to keep discussions safe, engaging, and fandom-focused.

---

## 🚀 Project Overview

**Tech Stack**
- ⚙️ **Backend:** ASP.NET Core 8 + SignalR + Entity Framework + PostgreSQL  
- 💬 **Frontend:** React Native (Expo) + TypeScript  
- 🧩 **AI Integration:** OpenAI Moderation API (context-aware)  
- 🛡️ **Database:** PostgreSQL (Users, Messages, ModerationLogs)  

---

## 🏗️ Implementation Summary

Chatzzz began with a solid backend foundation using ASP.NET Core, EF Core, and PostgreSQL, with Firebase authentication for secure user access. Real-time chat capabilities were enabled via **SignalR**, allowing users to join dedicated anime-themed rooms like *“JJK Buzz”* and participate in group discussions. The system integrates an **AI Moderation Service**, powered by OpenAI, to evaluate messages with contextual awareness using a custom `ContextService` that retains recent chat history.  

Messages that breach moderation rules are **soft-deleted**, with the sender receiving an in-app warning popup while others never see the message. Each moderation action is logged to the `ModerationLogs` table with the category, score, and reasoning for audit purposes.  

A **violation tracking mechanism** increments a user's `ViolationCount` on each offense, automatically banning them when the count exceeds a defined threshold (typically 3–10). Banned users are disconnected instantly via `Context.Abort()` and prevented from sending further messages. This pipeline now ensures reliable contextual filtering, accountability, and fairness within live chat interactions.

---

## 🧠 Contextual Moderation Logic

The moderation system evaluates:
- The **current message content**
- The **last 3 chat messages** in the same room (the count can be increased aswell)
- The **user’s historical violation count**

### **Workflow**
1. Message content and context are sent to OpenAI’s Moderation API  
2. If flagged (`IsFlagged = true`), the message is soft-deleted  
3. A log entry is created in `ModerationLogs`  
4. The user’s violation count increases  
5. On repeated offenses, the account is banned and disconnected  

---

## 🧩 Key AI Features

| Feature | Description |
|----------|--------------|
| **Context-aware moderation** | Evaluates messages using previous conversation snippets |
| **Soft delete system** |  flagged text|
| **Violation tracking** | Records repeat offenses leading to automatic bans |
| **Moderation logs** | Every AI decision stored with score, category, and reason |
| **Context buffer** | Retains message history for smarter contextual decisions |

---

## 🧪 Demo Scenario Example

| Step | User | Behavior | Result |
|------|-------|-----------|--------|
| 1 | U-3 | “Kill the writers 💀” | Soft warning (violence) |
| 2 | U-3 | “Sukuna’s too hot 😳” | Sexual flag (soft delete) |
| 3 | U-3 | “I’ll punch every hater 🤬” | Violence flag |
| 4 | U-3 | “They should disappear” | Hate/harassment → Permanent Ban |

Each flagged message is visible only to the sender (as blocked), not others.  
All flagged events are stored in the backend for transparency and later review.

---

## 🔮 Future Scope

The next milestone is integrating **ML.NET** for on-device moderation and adaptive learning.  
This will enable faster, offline moderation without relying on external APIs and allow the model to understand anime-related slang, sarcasm, and fandom expressions more accurately.  

Future expansions include:
- 🧩 **Admin Dashboard** to review moderation logs, manage bans, and unban users.  
- 🧠 **Custom ML.NET models** fine-tuned for anime/meme culture.  
- 🌐 **Semantic context understanding** using embeddings to differentiate storytelling from threats.  
- 💬 **User reputation scoring** to reward positive contributors.  
- 📊 **Analytics dashboard** for tracking moderation trends and user engagement.

---

## ⚙️ Setup Instructions

```bash
# Clone the repository
git clone https://github.com/<yourusername>/weebChat.git
cd weebChat

# Backend setup
dotnet restore
dotnet ef database update
dotnet run

# Frontend setup
cd frontend/weebchat-app
npm install
npx expo start
