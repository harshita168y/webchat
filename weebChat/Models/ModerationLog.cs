using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace weebChat.Data
{
    public class ModerationLog
    {
        [Key]
        public int Id { get; set; }

        [ForeignKey("Message")]
        public int MessageId { get; set; }

        public string SenderUid { get; set; } = string.Empty;
        public string? Category { get; set; }
        public double? Score { get; set; }
        public string? Reason { get; set; }
        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

        public virtual Message? Message { get; set; }
    }
}
