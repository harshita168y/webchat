using weebChat.Data;

namespace weebChat.Models
{
    public class User
    {
        public int Id { get; set; }
        public string FirebaseUid { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? DisplayName { get; set; }
        public bool IsAnonymous { get; set; }
        public bool IsBanned { get; set; } = false;
        public int ReportCount { get; set; } = 0;
        public DateTime LastLogin { get; set; } = DateTime.UtcNow;
        //  Navigation properties

        public ChatRoom? ChatRoom { get; set; }

        //  Moderation-related fields
        public bool IsDeleted { get; set; } = false;
        public bool IsFlagged { get; set; } = false;
        public string? ModerationCategory { get; set; }
        public double? ModerationScore { get; set; }

    }
}
