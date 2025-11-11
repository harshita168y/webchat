// Data/ModerationModels.cs
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace weebChat.Data
{
    public class Report
    {
        [Key]
        public int Id { get; set; }

        public int MessageId { get; set; }
        public string ReporterUid { get; set; } = string.Empty; // who reported

        public string ReportedUid { get; set; } = string.Empty; // owner of message
        public string Reason { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    }
}
