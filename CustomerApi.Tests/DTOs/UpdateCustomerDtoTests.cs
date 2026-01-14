using System.ComponentModel.DataAnnotations;
using CustomerApi.DTOs;
using FluentAssertions;

namespace CustomerApi.Tests.DTOs;

public class UpdateCustomerDtoTests
{
    private static List<ValidationResult> ValidateModel(object model)
    {
        var results = new List<ValidationResult>();
        var context = new ValidationContext(model);
        Validator.TryValidateObject(model, context, results, true);
        return results;
    }

    [Fact]
    public void UpdateCustomerDto_ValidData_PassesValidation()
    {
        var dto = new UpdateCustomerDto
        {
            Name = "John Doe",
            Email = "john@example.com",
            Phone = "+1234567890",
            Address = "123 Main St"
        };

        var results = ValidateModel(dto);

        results.Should().BeEmpty();
    }

    [Fact]
    public void UpdateCustomerDto_MissingName_FailsValidation()
    {
        var dto = new UpdateCustomerDto
        {
            Name = "",
            Email = "john@example.com"
        };

        var results = ValidateModel(dto);

        results.Should().ContainSingle(r => r.MemberNames.Contains("Name"));
    }

    [Fact]
    public void UpdateCustomerDto_NameTooLong_FailsValidation()
    {
        var dto = new UpdateCustomerDto
        {
            Name = new string('a', 101),
            Email = "john@example.com"
        };

        var results = ValidateModel(dto);

        results.Should().ContainSingle(r => r.MemberNames.Contains("Name"));
    }

    [Fact]
    public void UpdateCustomerDto_MissingEmail_FailsValidation()
    {
        var dto = new UpdateCustomerDto
        {
            Name = "John Doe",
            Email = ""
        };

        var results = ValidateModel(dto);

        results.Should().ContainSingle(r => r.MemberNames.Contains("Email"));
    }

    [Fact]
    public void UpdateCustomerDto_InvalidEmailFormat_FailsValidation()
    {
        var dto = new UpdateCustomerDto
        {
            Name = "John Doe",
            Email = "not-an-email"
        };

        var results = ValidateModel(dto);

        results.Should().ContainSingle(r => r.MemberNames.Contains("Email"));
    }

    [Fact]
    public void UpdateCustomerDto_PhoneTooLong_FailsValidation()
    {
        var dto = new UpdateCustomerDto
        {
            Name = "John Doe",
            Email = "john@example.com",
            Phone = new string('1', 21)
        };

        var results = ValidateModel(dto);

        results.Should().ContainSingle(r => r.MemberNames.Contains("Phone"));
    }

    [Fact]
    public void UpdateCustomerDto_AddressTooLong_FailsValidation()
    {
        var dto = new UpdateCustomerDto
        {
            Name = "John Doe",
            Email = "john@example.com",
            Address = new string('a', 501)
        };

        var results = ValidateModel(dto);

        results.Should().ContainSingle(r => r.MemberNames.Contains("Address"));
    }
}
