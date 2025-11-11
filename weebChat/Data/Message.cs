using System;

namespace weebChat.Data
{
    public class Message
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int ChatRoomId { get; set; }
        public string Content { get; set; } = string.Empty;
        public string SenderUid { get; set; } = string.Empty;
        public DateTime SentAt { get; set; } = DateTime.UtcNow;

        // Relationships
        public User? User { get; set; }
        public ChatRoom? ChatRoom { get; set; }

        //  Moderation-related fields
        public bool IsDeleted { get; set; } = false;
        public bool IsFlagged { get; set; } = false;
        public string? ModerationCategory { get; set; }
        public double? ModerationScore { get; set; }
    }
}
