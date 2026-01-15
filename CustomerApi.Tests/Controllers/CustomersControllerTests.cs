using AutoMapper;
using CustomerApi.Controllers;
using CustomerApi.DTOs;
using CustomerApi.Mappings;
using CustomerApi.Models;
using CustomerApi.Repositories;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace CustomerApi.Tests.Controllers;

public class CustomersControllerTests
{
    private readonly Mock<ICustomerRepository> _mockRepository;
    private readonly IMapper _mapper;
    private readonly CustomersController _controller;

    public CustomersControllerTests()
    {
        _mockRepository = new Mock<ICustomerRepository>();

        // Setup AutoMapper with actual profile
        var config = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<CustomerProfile>();
        });
        _mapper = config.CreateMapper();

        _controller = new CustomersController(_mockRepository.Object, _mapper);
    }

    #region CreateCustomer Tests

    [Fact]
    public async Task CreateCustomer_ValidDto_Returns201CreatedWithCustomer()
    {
        // Arrange
        var createDto = new CreateCustomerDto
        {
            Name = "John Doe",
            Email = "john@example.com",
            Phone = "+1234567890",
            Address = "123 Main St"
        };

        var createdCustomer = new Customer
        {
            Id = Guid.NewGuid(),
            Name = createDto.Name,
            Email = createDto.Email,
            Phone = createDto.Phone,
            Address = createDto.Address,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockRepository
            .Setup(r => r.CreateAsync(It.IsAny<Customer>()))
            .ReturnsAsync(createdCustomer);

        // Act
        var result = await _controller.CreateCustomer(createDto);

        // Assert
        result.Result.Should().BeOfType<CreatedAtActionResult>();
        var createdResult = result.Result as CreatedAtActionResult;
        createdResult!.StatusCode.Should().Be(201);

        var responseDto = createdResult.Value as CustomerResponseDto;
        responseDto.Should().NotBeNull();
        responseDto!.Id.Should().Be(createdCustomer.Id);
        responseDto.Name.Should().Be(createDto.Name);
        responseDto.Email.Should().Be(createDto.Email);
        responseDto.Phone.Should().Be(createDto.Phone);
        responseDto.Address.Should().Be(createDto.Address);
        responseDto.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        responseDto.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task CreateCustomer_ValidDto_CallsRepositoryCreate()
    {
        // Arrange
        var createDto = new CreateCustomerDto
        {
            Name = "Jane Smith",
            Email = "jane@example.com"
        };

        var createdCustomer = new Customer
        {
            Id = Guid.NewGuid(),
            Name = createDto.Name,
            Email = createDto.Email,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockRepository
            .Setup(r => r.CreateAsync(It.IsAny<Customer>()))
            .ReturnsAsync(createdCustomer);

        // Act
        await _controller.CreateCustomer(createDto);

        // Assert
        _mockRepository.Verify(
            r => r.CreateAsync(It.Is<Customer>(c =>
                c.Name == createDto.Name &&
                c.Email == createDto.Email &&
                c.Id != Guid.Empty &&
                c.CreatedAt != default &&
                c.UpdatedAt != default)),
            Times.Once);
    }

    [Fact]
    public async Task CreateCustomer_SetsTimestampsToUtcNow()
    {
        // Arrange
        var createDto = new CreateCustomerDto
        {
            Name = "Test User",
            Email = "test@example.com"
        };

        Customer capturedCustomer = null!;
        _mockRepository
            .Setup(r => r.CreateAsync(It.IsAny<Customer>()))
            .Callback<Customer>(c => capturedCustomer = c)
            .ReturnsAsync((Customer c) => c);

        // Act
        var beforeCall = DateTime.UtcNow;
        await _controller.CreateCustomer(createDto);
        var afterCall = DateTime.UtcNow;

        // Assert
        capturedCustomer.Should().NotBeNull();
        capturedCustomer.CreatedAt.Should().BeOnOrAfter(beforeCall).And.BeOnOrBefore(afterCall);
        capturedCustomer.UpdatedAt.Should().BeOnOrAfter(beforeCall).And.BeOnOrBefore(afterCall);
        capturedCustomer.CreatedAt.Kind.Should().Be(DateTimeKind.Utc);
        capturedCustomer.UpdatedAt.Kind.Should().Be(DateTimeKind.Utc);
    }

    [Fact]
    public async Task CreateCustomer_GeneratesNewGuidForId()
    {
        // Arrange
        var createDto = new CreateCustomerDto
        {
            Name = "Test User",
            Email = "test@example.com"
        };

        Customer capturedCustomer = null!;
        _mockRepository
            .Setup(r => r.CreateAsync(It.IsAny<Customer>()))
            .Callback<Customer>(c => capturedCustomer = c)
            .ReturnsAsync((Customer c) => c);

        // Act
        await _controller.CreateCustomer(createDto);

        // Assert
        capturedCustomer.Should().NotBeNull();
        capturedCustomer.Id.Should().NotBeEmpty();
    }

    [Fact]
    public async Task CreateCustomer_WithOptionalFields_CreatesSuccessfully()
    {
        // Arrange
        var createDto = new CreateCustomerDto
        {
            Name = "Minimal User",
            Email = "minimal@example.com"
            // Phone and Address are null
        };

        var createdCustomer = new Customer
        {
            Id = Guid.NewGuid(),
            Name = createDto.Name,
            Email = createDto.Email,
            Phone = null,
            Address = null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockRepository
            .Setup(r => r.CreateAsync(It.IsAny<Customer>()))
            .ReturnsAsync(createdCustomer);

        // Act
        var result = await _controller.CreateCustomer(createDto);

        // Assert
        result.Result.Should().BeOfType<CreatedAtActionResult>();
        var createdResult = result.Result as CreatedAtActionResult;
        var responseDto = createdResult!.Value as CustomerResponseDto;
        responseDto!.Phone.Should().BeNull();
        responseDto.Address.Should().BeNull();
    }

    [Fact]
    public async Task CreateCustomer_InvalidModelState_Returns400BadRequest()
    {
        // Arrange
        var createDto = new CreateCustomerDto
        {
            Name = "Test User",
            Email = "invalid-email" // Invalid email format
        };

        _controller.ModelState.AddModelError("Email", "Invalid email format");

        // Act
        var result = await _controller.CreateCustomer(createDto);

        // Assert
        result.Result.Should().BeOfType<BadRequestObjectResult>();
        var badRequestResult = result.Result as BadRequestObjectResult;
        badRequestResult!.StatusCode.Should().Be(400);
    }

    [Fact]
    public async Task CreateCustomer_InvalidModelState_DoesNotCallRepository()
    {
        // Arrange
        var createDto = new CreateCustomerDto
        {
            Name = "",
            Email = "test@example.com"
        };

        _controller.ModelState.AddModelError("Name", "Name is required");

        // Act
        await _controller.CreateCustomer(createDto);

        // Assert
        _mockRepository.Verify(r => r.CreateAsync(It.IsAny<Customer>()), Times.Never);
    }

    [Fact]
    public async Task CreateCustomer_ReturnsLocationHeader()
    {
        // Arrange
        var createDto = new CreateCustomerDto
        {
            Name = "Test User",
            Email = "test@example.com"
        };

        var createdCustomer = new Customer
        {
            Id = Guid.NewGuid(),
            Name = createDto.Name,
            Email = createDto.Email,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockRepository
            .Setup(r => r.CreateAsync(It.IsAny<Customer>()))
            .ReturnsAsync(createdCustomer);

        // Act
        var result = await _controller.CreateCustomer(createDto);

        // Assert
        var createdResult = result.Result as CreatedAtActionResult;
        createdResult.Should().NotBeNull();
        createdResult!.ActionName.Should().Be(nameof(CustomersController.CreateCustomer));
        createdResult.RouteValues.Should().ContainKey("id");
        createdResult.RouteValues!["id"].Should().Be(createdCustomer.Id);
    }

    [Fact]
    public async Task CreateCustomer_MaxLengthFields_CreatesSuccessfully()
    {
        // Arrange
        var createDto = new CreateCustomerDto
        {
            Name = new string('A', 100), // Max 100 chars
            Email = new string('a', 243) + "@example.com", // Max 255 chars
            Phone = new string('1', 20), // Max 20 chars
            Address = new string('B', 500) // Max 500 chars
        };

        var createdCustomer = new Customer
        {
            Id = Guid.NewGuid(),
            Name = createDto.Name,
            Email = createDto.Email,
            Phone = createDto.Phone,
            Address = createDto.Address,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockRepository
            .Setup(r => r.CreateAsync(It.IsAny<Customer>()))
            .ReturnsAsync(createdCustomer);

        // Act
        var result = await _controller.CreateCustomer(createDto);

        // Assert
        result.Result.Should().BeOfType<CreatedAtActionResult>();
    }

    #endregion
}
