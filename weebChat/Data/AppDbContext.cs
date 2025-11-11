
using Microsoft.EntityFrameworkCore;
namespace weebChat.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<ChatRoom> ChatRooms { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<Report> Reports { get; set; }

        public DbSet<ModerationLog> ModerationLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Add this configuration
            modelBuilder.Entity<ModerationLog>()
                .HasOne(l => l.Message)
                .WithMany()
                .HasForeignKey(l => l.MessageId)
                .OnDelete(DeleteBehavior.Cascade);
        }

    }

    public class User
    {
        public int Id { get; set; }
        public string Uid { get; set; } = string.Empty;         
        public string? Email { get; set; }                      
        public string? DisplayName { get; set; }                
        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
        public DateTime LastLoginUtc { get; set; } = DateTime.UtcNow;
        public bool IsBanned { get; set; } = false;
        public int ReportCount { get; set; } = 0;
        public int ViolationCount { get; set; }

    }

}

