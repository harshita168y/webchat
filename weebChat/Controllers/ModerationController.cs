using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using weebChat.Data;
using weebChat.Services;  
using System.Threading.Tasks;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ModerationController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IModerationService _moderation; 

    private const int BAN_THRESHOLD = 10;

    // Updated constructor with dependency injection
    public ModerationController(AppDbContext db, IModerationService moderation)
    {
        _db = db;
        _moderation = moderation;

    }

    [AllowAnonymous]
    [HttpPost("evaluate")]
    public async Task<IActionResult> Evaluate([FromBody] ModerationRequest req)
    {
        if (req == null || string.IsNullOrWhiteSpace(req.Content))
            return BadRequest("Content cannot be empty");

        if (_moderation == null)
            return StatusCode(500, "Moderation service not available");

        Console.WriteLine($"🧠 Moderation request: {req.Content}");

        try
        {
            Console.WriteLine("🚀 Calling EvaluateWithContextAsync...");
            var result = await _moderation.EvaluateWithContextAsync(
                req.Content,
                req.Context ?? string.Empty,
                "frontend"
            );
            Console.WriteLine("✅ Moderation result received");
            return Ok(result);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Moderation service failed: {ex.Message}");
            return StatusCode(500, $"Moderation failed: {ex.Message}");
        }


        //return Ok(result);
    }


    // EXISTING: Manual report endpoint (keep untouched)
    [HttpPost("report")]
    public async Task<IActionResult> Report([FromBody] ReportRequest req)
    {
        if (req == null || req.MessageId <= 0 || string.IsNullOrEmpty(req.Reason))
            return BadRequest("messageId and reason required.");

        var reporterUid = User.FindFirstValue("user_id") ??
                          User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                          User.FindFirstValue("sub");
        if (string.IsNullOrEmpty(reporterUid))
            return Unauthorized();

        var message = await _db.Messages
            .Include(m => m.User)
            .FirstOrDefaultAsync(m => m.Id == req.MessageId);

        if (message == null)
            return NotFound("Message not found.");

        var reportedUid = message.SenderUid ?? message.User?.Uid ?? "unknown";

        if (reportedUid == reporterUid)
            return BadRequest("You cannot report your own message.");

        var report = new Report
        {
            MessageId = req.MessageId,
            ReporterUid = reporterUid,
            ReportedUid = reportedUid,
            Reason = req.Reason,
            Details = req.Details ?? string.Empty,
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.Add(report);

        var reportedUser = await _db.Users.FirstOrDefaultAsync(u => u.Uid == reportedUid);
        if (reportedUser == null)
        {
            reportedUser = new User
            {
                Uid = reportedUid,
                DisplayName = "Unknown",
                CreatedAtUtc = DateTime.UtcNow
            };
            _db.Users.Add(reportedUser);
        }

        reportedUser.ReportCount += 1;

        if (reportedUser.ReportCount >= BAN_THRESHOLD)
        {
            reportedUser.IsBanned = true;
            var msgs = await _db.Messages.Where(m => m.SenderUid == reportedUid).ToListAsync();
            foreach (var m in msgs)
            {
            }
        }

        await _db.SaveChangesAsync();

        return Ok(new
        {
            result = "reported",
            reportId = report.Id,
            banned = reportedUser.IsBanned
        });
    }
}

public class ReportRequest
{
    public int MessageId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? Details { get; set; }
}

public class ModerationRequest
{
    public string Content { get; set; } = string.Empty;
    public string? Context { get; set; } 
}

