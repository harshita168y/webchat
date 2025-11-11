

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using weebChat.Data;
using weebChat.Services;
using Microsoft.Extensions.DependencyInjection;

namespace weebChat.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly AppDbContext _db;
        private readonly ContextService _contextService;
        private readonly IModerationService _moderationService;
        private readonly IServiceScopeFactory _scopeFactory;

        public ChatHub(AppDbContext db, ContextService contextService,
    IModerationService moderationService, IServiceScopeFactory scopeFactory)
        {
            _db = db; _contextService = contextService;
            _moderationService = moderationService;
            _scopeFactory = scopeFactory;
        }



        // When user joins a room
        public async Task JoinRoom(string roomId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, roomId);

            var uid = Context.User?.FindFirstValue("user_id") ?? Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Uid == uid);
            var displayName = user?.DisplayName ?? "Anonymous Weeb";

            await Clients.Group(roomId).SendAsync("SystemMessage", $"🟢 {displayName} joined the room");
            Console.WriteLine($"✅ {displayName} joined room {roomId}");
        }

        // When user leaves a room
        public async Task LeaveRoom(string roomId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId);

            var uid = Context.User?.FindFirstValue("user_id") ?? Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Uid == uid);
            var displayName = user?.DisplayName ?? "Anonymous Weeb";

            await Clients.Group(roomId).SendAsync("SystemMessage", $"🔴 {displayName} left the room");
            Console.WriteLine($"👋 {displayName} left room {roomId}");
        }
        public async Task SendMessage(string roomId, string content)

        {
            Console.WriteLine($"📨 SendMessage hit! roomId={roomId}, content={content}");

            if (string.IsNullOrWhiteSpace(roomId) || string.IsNullOrWhiteSpace(content))
                return;

            var uid = Context.User?.FindFirst("user_id")?.Value;
            if (string.IsNullOrEmpty(uid))
            {
                await Clients.Caller.SendAsync("SystemMessage", "Unauthorized user.");
                return;
            }

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Uid == uid);
            if (user != null && user.IsBanned)
            {
                await Clients.Caller.SendAsync("SystemMessage",
                    "🚫 You are banned and cannot send messages.");

                //  Ensure the connection is dropped too
                Context.Abort();
                return;
            }
            if (user == null)
            {
                user = new User
                {
                    Uid = uid,
                    DisplayName = "Anonymous Weeb",
                    Email = Context.User?.FindFirst("email")?.Value ?? "unknown@weebchat.app",
                    CreatedAtUtc = DateTime.UtcNow
                };
                _db.Users.Add(user);
                await _db.SaveChangesAsync();
            }

            //  AI moderation check (backend confirmation)
            var contextSnippet = _contextService.GetContextSnippet(roomId);
            var modResult = await _moderationService.EvaluateWithContextAsync(content, contextSnippet, uid);

            //  1️⃣ If flagged (either frontend told us OR backend confirmed)
            if (modResult.IsFlagged)
            {

                // 👇 Add this right under "if (modResult.IsFlagged)"
                Console.WriteLine($"⚙️ Moderation score = {modResult.Score}, category = {modResult.Category}");

                // Soft vs Hard flag threshold
                double softThreshold = 0.55;
                double hardThreshold = 0.85;

                if (modResult.Score.HasValue && modResult.Score.Value < softThreshold)
                {
                    Console.WriteLine("✅ Low confidence — no moderation action taken.");
                    modResult.IsFlagged = false; // continue normally
                }
                else if (modResult.Score.HasValue && modResult.Score.Value < hardThreshold)
                {
                    // 🟡 Soft violation: warn & log but don’t delete or ban
                    await Clients.Caller.SendAsync("SystemMessage",
                        $"⚠️ Warning: {modResult.Reason} ({modResult.Category})");

                    user.ViolationCount += 1;
                    _db.Users.Update(user);
                    await _db.SaveChangesAsync();

                    Console.WriteLine($"🟡 Soft violation logged for {user.Uid}, total = {user.ViolationCount}");
                    return; // stop further processing but don’t delete the message
                }

                // 🟥 Anything above hardThreshold continues to the existing hard-flag logic

                var flaggedMsg = new Message
                {
                    ChatRoomId = int.Parse(roomId),
                    Content = "[Message removed by moderation]",
                    SenderUid = uid,
                    UserId = user.Id,
                    IsDeleted = true,
                    IsFlagged = true,
                    ModerationCategory = modResult.Category ?? "flagged",
                    ModerationScore = modResult.Score ?? 1.0,
                    SentAt = DateTime.UtcNow
                };

                await _db.Messages.AddAsync(flaggedMsg);
                await _db.SaveChangesAsync();

                // Save moderation log
                var log = new ModerationLog
                {
                    MessageId = flaggedMsg.Id,
                    SenderUid = uid,
                    Category = modResult.Category ?? "flagged",
                    Score = modResult.Score ?? 1.0,
                    Reason = modResult.Reason ?? "Flagged by moderation",
                    CreatedAtUtc = DateTime.UtcNow
                };
                await _db.ModerationLogs.AddAsync(log);
                await _db.SaveChangesAsync();

                //  Violation counter & banning
                user.ViolationCount += 1;
                _db.Users.Update(user);
                await _db.SaveChangesAsync();  // <-- commit the increment
                Console.WriteLine($"⚙️ User {user.Uid} now has {user.ViolationCount} violations");
                if (user.ViolationCount >= 3)
                {
                    user.IsBanned = true;
                    await _db.SaveChangesAsync();

                    await Clients.Caller.SendAsync(
                        "SystemMessage",
                        "🚫 Your account has been permanently banned due to repeated violations."
                    );
                    Context.Abort();
                    return;
                }

                await Clients.Caller.SendAsync(
                    "SystemMessage",
                    $"⚠️ Message blocked: {modResult.Reason} ({modResult.Category})"
                );

                return;
            }

            //  2️⃣ Normal message flow
            var cleanMsg = new Message
            {
                ChatRoomId = int.Parse(roomId),
                Content = content,
                SenderUid = uid,
                UserId = user.Id,
                SentAt = DateTime.UtcNow
            };

            _db.Messages.Add(cleanMsg);
            await _db.SaveChangesAsync();

            _contextService.AddMessage(roomId, content);

            await Clients.Group(roomId).SendAsync("ReceiveMessage", new
            {
                RoomId = roomId,
                Content = cleanMsg.Content,
                SenderUid = cleanMsg.SenderUid,
                SenderName = user.DisplayName ?? "Anonymous",
                SentAt = cleanMsg.SentAt
            });
        }




        //  Handle user disconnecting
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var uid = Context.User?.FindFirstValue("user_id") ?? Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Uid == uid);
            var displayName = user?.DisplayName ?? "Anonymous Weeb";

            // Optional: broadcast disconnect message
            await Clients.All.SendAsync("SystemMessage", $"⚫ {displayName} disconnected");

            Console.WriteLine($"⚫ {displayName} disconnected from SignalR");
            await base.OnDisconnectedAsync(exception);
        }
    }
}
