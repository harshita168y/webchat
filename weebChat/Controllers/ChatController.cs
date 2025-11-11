using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using weebChat.Data;
using weebChat.Services;



namespace weebChat.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IModerationService _moderationService;

        public ChatController(AppDbContext db, IModerationService moderationService)
        {
            _db = db;
            _moderationService = moderationService;
        }
        [HttpPost("create-room")]
        public async Task<IActionResult> CreateRoom([FromBody] CreateRoomRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.RoomName))
                return BadRequest("Room name is required.");

            var room = new ChatRoom { RoomName = req.RoomName, CreatedAt = DateTime.UtcNow };
            _db.ChatRooms.Add(room);
            await _db.SaveChangesAsync();

            return Ok(room);
        }

        // GET /api/chat/rooms
        [HttpGet("rooms")]
        public async Task<IActionResult> GetRooms()
        {
            var rooms = await _db.ChatRooms
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new { r.Id, r.RoomName, r.CreatedAt })
                .ToListAsync();

            return Ok(rooms);
        }

        // POST /api/chat/send
        [HttpPost("send")]
        public async Task<IActionResult> SendMessage([FromBody] SendMessageRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Content))
                return BadRequest("Message content cannot be empty.");

            var uid = User.FindFirstValue("user_id")
                      ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
                      ?? User.FindFirstValue("sub");

            if (string.IsNullOrEmpty(uid))
                return Unauthorized("Invalid user token.");

            //  Try to find the user
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Uid == uid);

            // If user doesn’t exist, create it automatically
            if (user == null)
            {
                user = new User
                {
                    Uid = uid,
                    Email = User.FindFirstValue("email") ?? "unknown@weebchat.app",
                    DisplayName = "Anonymous Weeb",
                    CreatedAtUtc = DateTime.UtcNow
                };
                _db.Users.Add(user);
                await _db.SaveChangesAsync();
            }

            //  Now we can safely assign UserId
            var message = new Message
            {
                ChatRoomId = req.RoomId,
                Content = req.Content,
                SenderUid = uid,
                UserId = user.Id,
                SentAt = DateTime.UtcNow
            };

            _db.Messages.Add(message);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message.Id,
                message.ChatRoomId,
                message.SenderUid,
                message.UserId,
                message.Content,
                message.SentAt,
               SenderName = user.DisplayName ?? "Anonymous"
            });

        }
        // GET /api/chat/messages/{roomId}
        [HttpGet("messages/{roomId}")]
        public async Task<IActionResult> GetMessages(int roomId)
        {
            var message = await _db.Messages
                .Include(m => m.User)
                .Where(m => m.ChatRoomId == roomId)
                .OrderBy(m => m.SentAt)
                .Select(m => new
                {
                    m.Id,
                    m.ChatRoomId,
                    m.Content,
                    m.SenderUid,
                    SenderName = m.User != null ? m.User.DisplayName : "Anonymous",
                    m.SentAt
                })
                .ToListAsync();

            return Ok(message);
        }
        [AllowAnonymous]
        [HttpPost("test-moderation")]
        public async Task<IActionResult> TestModeration([FromBody] string content)
        {
            var uid = "test_user"; // hardcoded just for testing
            var contextSnippet = "anime chat about attack on titan";

            var modResult = await _moderationService.EvaluateWithContextAsync(content, contextSnippet, uid);

            if (modResult.IsFlagged)
            {
                var flaggedMsg = new Message
                {
                    ChatRoomId = 1,
                    Content = "[Blocked in test]",
                    SenderUid = uid,
                    UserId = 1, // just assume test user id exists
                    IsDeleted = true,
                    IsFlagged = true,
                    ModerationCategory = modResult.Category,
                    ModerationScore = modResult.Score,
                    SentAt = DateTime.UtcNow
                };

                await _db.Messages.AddAsync(flaggedMsg);
                await _db.SaveChangesAsync();
                await _db.Entry(flaggedMsg).ReloadAsync();

                var log = new ModerationLog
                {
                    MessageId = flaggedMsg.Id,
                    SenderUid = uid,
                    Category = modResult.Category,
                    Score = modResult.Score,
                    Reason = modResult.Reason,
                    CreatedAtUtc = DateTime.UtcNow
                };

                await _db.ModerationLogs.AddAsync(log);
                await _db.SaveChangesAsync();

                return Ok(new
                {
                    status = "blocked",
                    reason = modResult.Reason,
                    category = modResult.Category,
                    messageId = flaggedMsg.Id,
                    logId = log.Id
                });
            }

            return Ok(new
            {
                status = "clean",
                reason = modResult.Reason,
                category = modResult.Category
            });
        }

    }

    // DTOs
    public class CreateRoomRequest
    {
        public string RoomName { get; set; } = string.Empty;
    }

    public class SendMessageRequest
    {
        public int RoomId { get; set; }
        public string Content { get; set; } = string.Empty;
    }
}
