using CustomerApi.DTOs;
using FluentAssertions;

namespace CustomerApi.Tests.DTOs;

public class CustomerResponseDtoTests
{
    [Fact]
    public void CustomerResponseDto_NewInstance_HasDefaultValues()
    {
        var dto = new CustomerResponseDto();

        dto.Id.Should().Be(Guid.Empty);
        dto.Name.Should().Be(string.Empty);
        dto.Email.Should().Be(string.Empty);
        dto.Phone.Should().BeNull();
        dto.Address.Should().BeNull();
    }

    [Fact]
    public void CustomerResponseDto_SetProperties_PropertiesAreSet()
    {
        var id = Guid.NewGuid();
        var createdAt = DateTime.UtcNow;
        var updatedAt = DateTime.UtcNow.AddHours(1);

        var dto = new CustomerResponseDto
        {
            Id = id,
            Name = "John Doe",
            Email = "john@example.com",
            Phone = "+1234567890",
            Address = "123 Main St",
            CreatedAt = createdAt,
            UpdatedAt = updatedAt
        };

        dto.Id.Should().Be(id);
        dto.Name.Should().Be("John Doe");
        dto.Email.Should().Be("john@example.com");
        dto.Phone.Should().Be("+1234567890");
        dto.Address.Should().Be("123 Main St");
        dto.CreatedAt.Should().Be(createdAt);
        dto.UpdatedAt.Should().Be(updatedAt);
    }
}
