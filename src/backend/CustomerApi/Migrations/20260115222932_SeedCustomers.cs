using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CustomerApi.Migrations
{
    /// <inheritdoc />
    public partial class SeedCustomers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            var now = DateTime.UtcNow;

            migrationBuilder.InsertData(
                table: "Customers",
                columns: new[] { "Id", "Name", "Email", "Phone", "Address", "IsDeleted", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy" },
                values: new object[,]
                {
                    { Guid.NewGuid(), "John Smith", "john.smith@email.com", "+1-555-0101", "123 Main St, New York, NY 10001, USA", false, now, now, null, null },
                    { Guid.NewGuid(), "Emma Johnson", "emma.j@email.com", "+1-555-0102", "456 Oak Ave, Los Angeles, CA 90001, USA", false, now, now, null, null },
                    { Guid.NewGuid(), "Michael Williams", "m.williams@email.com", "+1-555-0103", "789 Pine Rd, Chicago, IL 60601, USA", false, now, now, null, null },
                    { Guid.NewGuid(), "Sophia Brown", "sophia.brown@email.com", "+1-555-0104", "321 Elm St, Houston, TX 77001, USA", false, now, now, null, null },
                    { Guid.NewGuid(), "James Davis", "james.davis@email.com", "+1-555-0105", "654 Maple Dr, Phoenix, AZ 85001, USA", false, now, now, null, null },
                    { Guid.NewGuid(), "Olivia Miller", "olivia.m@email.com", "+1-555-0106", "987 Cedar Ln, Philadelphia, PA 19101, USA", false, now, now, null, null },
                    { Guid.NewGuid(), "William Wilson", "will.wilson@email.com", "+1-555-0107", "147 Birch Blvd, San Antonio, TX 78201, USA", false, now, now, null, null },
                    { Guid.NewGuid(), "Ava Moore", "ava.moore@email.com", "+1-555-0108", "258 Spruce Way, San Diego, CA 92101, USA", false, now, now, null, null },
                    { Guid.NewGuid(), "Robert Taylor", "rob.taylor@email.com", "+1-555-0109", "369 Willow Ct, Dallas, TX 75201, USA", false, now, now, null, null },
                    { Guid.NewGuid(), "Isabella Anderson", "isabella.a@email.com", "+1-555-0110", "741 Ash Ter, San Jose, CA 95101, USA", false, now, now, null, null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM Customers WHERE Email IN ('john.smith@email.com', 'emma.j@email.com', 'm.williams@email.com', 'sophia.brown@email.com', 'james.davis@email.com', 'olivia.m@email.com', 'will.wilson@email.com', 'ava.moore@email.com', 'rob.taylor@email.com', 'isabella.a@email.com')");
        }
    }
}
