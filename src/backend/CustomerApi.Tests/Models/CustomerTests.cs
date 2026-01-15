using CustomerApi.Models;
using FluentAssertions;

namespace CustomerApi.Tests.Models;

public class CustomerTests
{
    [Fact]
    public void Customer_NewInstance_HasDefaultValues()
    {
        var customer = new Customer();

        customer.Id.Should().Be(Guid.Empty);
        customer.Name.Should().Be(string.Empty);
        customer.Email.Should().Be(string.Empty);
        customer.Phone.Should().BeNull();
        customer.Address.Should().BeNull();
        customer.IsDeleted.Should().BeFalse();
        customer.CreatedBy.Should().BeNull();
        customer.UpdatedBy.Should().BeNull();
    }

    [Fact]
    public void Customer_SetProperties_PropertiesAreSet()
    {
        var id = Guid.NewGuid();
        var createdAt = DateTime.UtcNow;
        var updatedAt = DateTime.UtcNow.AddHours(1);

        var customer = new Customer
        {
            Id = id,
            Name = "John Doe",
            Email = "john@example.com",
            Phone = "+1234567890",
            Address = "123 Main St",
            IsDeleted = false,
            CreatedAt = createdAt,
            UpdatedAt = updatedAt,
            CreatedBy = "admin",
            UpdatedBy = "admin"
        };

        customer.Id.Should().Be(id);
        customer.Name.Should().Be("John Doe");
        customer.Email.Should().Be("john@example.com");
        customer.Phone.Should().Be("+1234567890");
        customer.Address.Should().Be("123 Main St");
        customer.IsDeleted.Should().BeFalse();
        customer.CreatedAt.Should().Be(createdAt);
        customer.UpdatedAt.Should().Be(updatedAt);
        customer.CreatedBy.Should().Be("admin");
        customer.UpdatedBy.Should().Be("admin");
    }

    [Fact]
    public void Customer_IsDeleted_CanBeSetToTrue()
    {
        var customer = new Customer { IsDeleted = true };

        customer.IsDeleted.Should().BeTrue();
    }
}
