using FirebaseAdmin.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using weebChat.Data;

namespace weebChat.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _db;
        public UserController(AppDbContext db) { _db = db; }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> Me()
        {
            var uid = User.FindFirstValue("user_id");
            if (string.IsNullOrEmpty(uid)) return Unauthorized();

            // Get user info from Firebase to stay in sync
            var record = await FirebaseAuth.DefaultInstance.GetUserAsync(uid);
            var email = record.Email; // null if anonymous

            // Upsert user
            var now = DateTime.UtcNow;
            var dbUser = await _db.Users.FirstOrDefaultAsync(u => u.Uid == uid);
            if (dbUser == null)
            {
                dbUser = new User
                {
                    Uid = uid,
                    Email = email,
                    DisplayName = record.DisplayName ?? email?.Split('@')[0] ?? "Anonymous",
                    CreatedAtUtc = now,
                    LastLoginUtc = now
                };
                _db.Users.Add(dbUser);
            }
            else
            {
                dbUser.Email = email;
                dbUser.LastLoginUtc = now;

                // ✅ Fill display name if missing
                if (string.IsNullOrEmpty(dbUser.DisplayName))
                    dbUser.DisplayName = record.DisplayName ?? email?.Split('@')[0] ?? "Anonymous";
            }

            await _db.SaveChangesAsync();

            return Ok(new
            {
                uid = dbUser.Uid,
                email = dbUser.Email,
                displayName = dbUser.DisplayName,
                createdAtUtc = dbUser.CreatedAtUtc,
                lastLoginUtc = dbUser.LastLoginUtc
            });
        }

        [HttpPost("displayname")]
        [Authorize]
        public async Task<IActionResult> SetDisplayName([FromBody] DisplayNameRequest req)
        {
            var uid = User.FindFirstValue("user_id");
            if (string.IsNullOrEmpty(uid)) return Unauthorized();

            // Find or create the user record
            var dbUser = await _db.Users.FirstOrDefaultAsync(u => u.Uid == uid);
            if (dbUser == null)
            {
                // Get from Firebase for consistency
                var record = await FirebaseAuth.DefaultInstance.GetUserAsync(uid);
                dbUser = new User
                {
                    Uid = uid,
                    Email = record.Email,
                    CreatedAtUtc = DateTime.UtcNow,
                    LastLoginUtc = DateTime.UtcNow,
                    DisplayName = req.DisplayName
                };
                _db.Users.Add(dbUser);
            }
            else
            {
                dbUser.DisplayName = req.DisplayName;
                dbUser.LastLoginUtc = DateTime.UtcNow;
            }
            Console.WriteLine($"[DEBUG] Saving display name '{req.DisplayName}' for UID {uid}");

            await _db.SaveChangesAsync();

            return Ok(new { uid = dbUser.Uid, displayName = dbUser.DisplayName });
        }

        public class DisplayNameRequest
        {
            public string DisplayName { get; set; } = string.Empty;
        }
    }
}
