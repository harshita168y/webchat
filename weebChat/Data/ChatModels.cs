using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace weebChat.Data
{
    public class ChatRoom
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string RoomName { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public class Message
        {
            [Key]
            public int Id { get; set; }

            [Required]
            public string Content { get; set; } = string.Empty;

            [Required]
            public string SenderUid { get; set; } = string.Empty;

            // 👇 NEW
            [ForeignKey("User")]
            public int? UserId { get; set; }
            public User? User { get; set; }

            [ForeignKey("ChatRoom")]
            public int ChatRoomId { get; set; }
            public ChatRoom? ChatRoom { get; set; }

            public DateTime SentAt { get; set; } = DateTime.UtcNow;
        }

    }
}