using AutoMapper;
using CustomerApi.DTOs;
using CustomerApi.Mappings;
using CustomerApi.Models;
using FluentAssertions;

namespace CustomerApi.Tests.Mappings;

public class CustomerProfileTests
{
    private readonly IMapper _mapper;

    public CustomerProfileTests()
    {
        var config = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<CustomerProfile>();
        });
        _mapper = config.CreateMapper();
    }

    [Fact]
    public void CustomerProfile_Configuration_IsValid()
    {
        var config = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<CustomerProfile>();
        });

        config.AssertConfigurationIsValid();
    }

    [Fact]
    public void Map_Customer_To_CustomerResponseDto_Success()
    {
        var customer = new Customer
        {
            Id = Guid.NewGuid(),
            Name = "John Doe",
            Email = "john@example.com",
            Phone = "+1234567890",
            Address = "123 Main St",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var result = _mapper.Map<CustomerResponseDto>(customer);

        result.Should().NotBeNull();
        result.Id.Should().Be(customer.Id);
        result.Name.Should().Be(customer.Name);
        result.Email.Should().Be(customer.Email);
        result.Phone.Should().Be(customer.Phone);
        result.Address.Should().Be(customer.Address);
        result.CreatedAt.Should().Be(customer.CreatedAt);
        result.UpdatedAt.Should().Be(customer.UpdatedAt);
    }

    [Fact]
    public void Map_CreateCustomerDto_To_Customer_Success()
    {
        var dto = new CreateCustomerDto
        {
            Name = "John Doe",
            Email = "john@example.com",
            Phone = "+1234567890",
            Address = "123 Main St"
        };

        var result = _mapper.Map<Customer>(dto);

        result.Should().NotBeNull();
        result.Name.Should().Be(dto.Name);
        result.Email.Should().Be(dto.Email);
        result.Phone.Should().Be(dto.Phone);
        result.Address.Should().Be(dto.Address);
        result.Id.Should().Be(Guid.Empty);
        result.CreatedAt.Should().Be(default);
        result.UpdatedAt.Should().Be(default);
    }

    [Fact]
    public void Map_UpdateCustomerDto_To_Customer_Success()
    {
        var dto = new UpdateCustomerDto
        {
            Name = "Jane Doe",
            Email = "jane@example.com",
            Phone = "+9876543210",
            Address = "456 Oak Ave"
        };

        var result = _mapper.Map<Customer>(dto);

        result.Should().NotBeNull();
        result.Name.Should().Be(dto.Name);
        result.Email.Should().Be(dto.Email);
        result.Phone.Should().Be(dto.Phone);
        result.Address.Should().Be(dto.Address);
        result.Id.Should().Be(Guid.Empty);
        result.CreatedAt.Should().Be(default);
        result.UpdatedAt.Should().Be(default);
    }

    [Fact]
    public void Map_CreateCustomerDto_To_Customer_NullOptionalFields_Success()
    {
        var dto = new CreateCustomerDto
        {
            Name = "John Doe",
            Email = "john@example.com",
            Phone = null,
            Address = null
        };

        var result = _mapper.Map<Customer>(dto);

        result.Should().NotBeNull();
        result.Name.Should().Be(dto.Name);
        result.Email.Should().Be(dto.Email);
        result.Phone.Should().BeNull();
        result.Address.Should().BeNull();
    }

    [Fact]
    public void Map_UpdateCustomerDto_To_Customer_NullOptionalFields_Success()
    {
        var dto = new UpdateCustomerDto
        {
            Name = "Jane Doe",
            Email = "jane@example.com",
            Phone = null,
            Address = null
        };

        var result = _mapper.Map<Customer>(dto);

        result.Should().NotBeNull();
        result.Name.Should().Be(dto.Name);
        result.Email.Should().Be(dto.Email);
        result.Phone.Should().BeNull();
        result.Address.Should().BeNull();
    }
}
