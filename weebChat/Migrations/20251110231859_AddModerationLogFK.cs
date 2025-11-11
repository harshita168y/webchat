using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace weebChat.Migrations
{
    /// <inheritdoc />
    public partial class AddModerationLogFK : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_Uid",
                table: "Users");

            migrationBuilder.CreateIndex(
                name: "IX_ModerationLogs_MessageId",
                table: "ModerationLogs",
                column: "MessageId");

            migrationBuilder.AddForeignKey(
                name: "FK_ModerationLogs_Messages_MessageId",
                table: "ModerationLogs",
                column: "MessageId",
                principalTable: "Messages",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ModerationLogs_Messages_MessageId",
                table: "ModerationLogs");

            migrationBuilder.DropIndex(
                name: "IX_ModerationLogs_MessageId",
                table: "ModerationLogs");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Uid",
                table: "Users",
                column: "Uid",
                unique: true);
        }
    }
}
