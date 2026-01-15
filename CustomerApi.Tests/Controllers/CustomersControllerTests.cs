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

    #region GetCustomerById Tests

    [Fact]
    public async Task GetCustomerById_ExistingId_Returns200OkWithCustomer()
    {
        // Arrange
        var customerId = Guid.NewGuid();
        var customer = new Customer
        {
            Id = customerId,
            Name = "John Doe",
            Email = "john@example.com",
            Phone = "+1234567890",
            Address = "123 Main St",
            CreatedAt = DateTime.UtcNow.AddDays(-5),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        };

        _mockRepository
            .Setup(r => r.GetByIdAsync(customerId))
            .ReturnsAsync(customer);

        // Act
        var result = await _controller.GetCustomerById(customerId);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        okResult!.StatusCode.Should().Be(200);

        var responseDto = okResult.Value as CustomerResponseDto;
        responseDto.Should().NotBeNull();
        responseDto!.Id.Should().Be(customer.Id);
        responseDto.Name.Should().Be(customer.Name);
        responseDto.Email.Should().Be(customer.Email);
        responseDto.Phone.Should().Be(customer.Phone);
        responseDto.Address.Should().Be(customer.Address);
        responseDto.CreatedAt.Should().Be(customer.CreatedAt);
        responseDto.UpdatedAt.Should().Be(customer.UpdatedAt);
    }

    [Fact]
    public async Task GetCustomerById_NonExistingId_Returns404NotFound()
    {
        // Arrange
        var nonExistingId = Guid.NewGuid();

        _mockRepository
            .Setup(r => r.GetByIdAsync(nonExistingId))
            .ReturnsAsync((Customer?)null);

        // Act
        var result = await _controller.GetCustomerById(nonExistingId);

        // Assert
        result.Result.Should().BeOfType<NotFoundObjectResult>();
        var notFoundResult = result.Result as NotFoundObjectResult;
        notFoundResult!.StatusCode.Should().Be(404);
    }

    [Fact]
    public async Task GetCustomerById_NonExistingId_ReturnsErrorMessage()
    {
        // Arrange
        var nonExistingId = Guid.NewGuid();

        _mockRepository
            .Setup(r => r.GetByIdAsync(nonExistingId))
            .ReturnsAsync((Customer?)null);

        // Act
        var result = await _controller.GetCustomerById(nonExistingId);

        // Assert
        var notFoundResult = result.Result as NotFoundObjectResult;
        notFoundResult.Should().NotBeNull();
        notFoundResult!.Value.Should().NotBeNull();

        var errorResponse = notFoundResult.Value;
        var messageProperty = errorResponse!.GetType().GetProperty("message");
        messageProperty.Should().NotBeNull();
        var message = messageProperty!.GetValue(errorResponse) as string;
        message.Should().Contain(nonExistingId.ToString());
        message.Should().Contain("not found");
    }

    [Fact]
    public async Task GetCustomerById_CallsRepositoryGetByIdAsync()
    {
        // Arrange
        var customerId = Guid.NewGuid();
        var customer = new Customer
        {
            Id = customerId,
            Name = "Test User",
            Email = "test@example.com",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockRepository
            .Setup(r => r.GetByIdAsync(customerId))
            .ReturnsAsync(customer);

        // Act
        await _controller.GetCustomerById(customerId);

        // Assert
        _mockRepository.Verify(r => r.GetByIdAsync(customerId), Times.Once);
    }

    [Fact]
    public async Task GetCustomerById_WithMinimalData_ReturnsSuccessfully()
    {
        // Arrange
        var customerId = Guid.NewGuid();
        var customer = new Customer
        {
            Id = customerId,
            Name = "Minimal User",
            Email = "minimal@example.com",
            Phone = null,
            Address = null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockRepository
            .Setup(r => r.GetByIdAsync(customerId))
            .ReturnsAsync(customer);

        // Act
        var result = await _controller.GetCustomerById(customerId);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        var responseDto = okResult!.Value as CustomerResponseDto;
        responseDto!.Phone.Should().BeNull();
        responseDto.Address.Should().BeNull();
    }

    #endregion

    #region GetCustomers Tests

    [Fact]
    public async Task GetCustomers_DefaultParameters_Returns200OkWithPaginatedResponse()
    {
        // Arrange
        var customers = new List<Customer>
        {
            new Customer
            {
                Id = Guid.NewGuid(),
                Name = "Customer 1",
                Email = "customer1@example.com",
                CreatedAt = DateTime.UtcNow.AddDays(-2),
                UpdatedAt = DateTime.UtcNow.AddDays(-2)
            },
            new Customer
            {
                Id = Guid.NewGuid(),
                Name = "Customer 2",
                Email = "customer2@example.com",
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                UpdatedAt = DateTime.UtcNow.AddDays(-1)
            }
        };

        _mockRepository
            .Setup(r => r.GetAllAsync(0, 10, null, null, null))
            .ReturnsAsync((customers, 2));

        // Act
        var result = await _controller.GetCustomers();

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        okResult!.StatusCode.Should().Be(200);

        var response = okResult.Value as PaginatedResponseDto<CustomerResponseDto>;
        response.Should().NotBeNull();
        response!.Items.Should().HaveCount(2);
        response.TotalCount.Should().Be(2);
        response.Page.Should().Be(1);
        response.PageSize.Should().Be(10);
        response.TotalPages.Should().Be(1);
    }

    [Fact]
    public async Task GetCustomers_CustomPageAndPageSize_ReturnsPaginatedResponse()
    {
        // Arrange
        var customers = new List<Customer>
        {
            new Customer
            {
                Id = Guid.NewGuid(),
                Name = "Customer 6",
                Email = "customer6@example.com",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        _mockRepository
            .Setup(r => r.GetAllAsync(10, 5, null, null, null))
            .ReturnsAsync((customers, 15));

        // Act
        var result = await _controller.GetCustomers(page: 3, pageSize: 5);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        var response = okResult!.Value as PaginatedResponseDto<CustomerResponseDto>;

        response.Should().NotBeNull();
        response!.Items.Should().HaveCount(1);
        response.TotalCount.Should().Be(15);
        response.Page.Should().Be(3);
        response.PageSize.Should().Be(5);
        response.TotalPages.Should().Be(3);
    }

    [Fact]
    public async Task GetCustomers_PageSizeExceedsMax_CapsAt100()
    {
        // Arrange
        var customers = new List<Customer>();
        _mockRepository
            .Setup(r => r.GetAllAsync(0, 100, null, null, null))
            .ReturnsAsync((customers, 0));

        // Act
        var result = await _controller.GetCustomers(page: 1, pageSize: 200);

        // Assert
        var okResult = result.Result as OkObjectResult;
        var response = okResult!.Value as PaginatedResponseDto<CustomerResponseDto>;
        response!.PageSize.Should().Be(100);

        _mockRepository.Verify(r => r.GetAllAsync(0, 100, null, null, null), Times.Once);
    }

    [Fact]
    public async Task GetCustomers_PageLessThan1_NormalizesTo1()
    {
        // Arrange
        var customers = new List<Customer>();
        _mockRepository
            .Setup(r => r.GetAllAsync(0, 10, null, null, null))
            .ReturnsAsync((customers, 0));

        // Act
        var result = await _controller.GetCustomers(page: 0, pageSize: 10);

        // Assert
        var okResult = result.Result as OkObjectResult;
        var response = okResult!.Value as PaginatedResponseDto<CustomerResponseDto>;
        response!.Page.Should().Be(1);

        _mockRepository.Verify(r => r.GetAllAsync(0, 10, null, null, null), Times.Once);
    }

    [Fact]
    public async Task GetCustomers_PageSizeLessThan1_NormalizesTo10()
    {
        // Arrange
        var customers = new List<Customer>();
        _mockRepository
            .Setup(r => r.GetAllAsync(0, 10, null, null, null))
            .ReturnsAsync((customers, 0));

        // Act
        var result = await _controller.GetCustomers(page: 1, pageSize: 0);

        // Assert
        var okResult = result.Result as OkObjectResult;
        var response = okResult!.Value as PaginatedResponseDto<CustomerResponseDto>;
        response!.PageSize.Should().Be(10);

        _mockRepository.Verify(r => r.GetAllAsync(0, 10, null, null, null), Times.Once);
    }

    [Fact]
    public async Task GetCustomers_NoCustomersExist_ReturnsEmptyItems()
    {
        // Arrange
        var customers = new List<Customer>();
        _mockRepository
            .Setup(r => r.GetAllAsync(0, 10, null, null, null))
            .ReturnsAsync((customers, 0));

        // Act
        var result = await _controller.GetCustomers();

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        var response = okResult!.Value as PaginatedResponseDto<CustomerResponseDto>;

        response.Should().NotBeNull();
        response!.Items.Should().BeEmpty();
        response.TotalCount.Should().Be(0);
        response.TotalPages.Should().Be(0);
    }

    [Fact]
    public async Task GetCustomers_CalculatesSkipCorrectly()
    {
        // Arrange
        var customers = new List<Customer>();
        _mockRepository
            .Setup(r => r.GetAllAsync(40, 20, null, null, null))
            .ReturnsAsync((customers, 100));

        // Act
        await _controller.GetCustomers(page: 3, pageSize: 20);

        // Assert - verify skip is (page - 1) * pageSize = 2 * 20 = 40
        _mockRepository.Verify(r => r.GetAllAsync(40, 20, null, null, null), Times.Once);
    }

    [Fact]
    public async Task GetCustomers_CalculatesTotalPagesCorrectly()
    {
        // Arrange
        var customers = new List<Customer>();
        _mockRepository
            .Setup(r => r.GetAllAsync(0, 10, null, null, null))
            .ReturnsAsync((customers, 25));

        // Act
        var result = await _controller.GetCustomers(page: 1, pageSize: 10);

        // Assert - totalPages should be ceiling(25/10) = 3
        var okResult = result.Result as OkObjectResult;
        var response = okResult!.Value as PaginatedResponseDto<CustomerResponseDto>;
        response!.TotalPages.Should().Be(3);
    }

    [Fact]
    public async Task GetCustomers_MapsCustomersToResponseDtos()
    {
        // Arrange
        var customer = new Customer
        {
            Id = Guid.NewGuid(),
            Name = "Test Customer",
            Email = "test@example.com",
            Phone = "+1234567890",
            Address = "123 Test St",
            CreatedAt = DateTime.UtcNow.AddDays(-5),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        };

        _mockRepository
            .Setup(r => r.GetAllAsync(0, 10, null, null, null))
            .ReturnsAsync((new List<Customer> { customer }, 1));

        // Act
        var result = await _controller.GetCustomers();

        // Assert
        var okResult = result.Result as OkObjectResult;
        var response = okResult!.Value as PaginatedResponseDto<CustomerResponseDto>;
        var dto = response!.Items.First();

        dto.Id.Should().Be(customer.Id);
        dto.Name.Should().Be(customer.Name);
        dto.Email.Should().Be(customer.Email);
        dto.Phone.Should().Be(customer.Phone);
        dto.Address.Should().Be(customer.Address);
        dto.CreatedAt.Should().Be(customer.CreatedAt);
        dto.UpdatedAt.Should().Be(customer.UpdatedAt);
    }

    [Fact]
    public async Task GetCustomers_MultipleCustomers_ReturnsAllInPage()
    {
        // Arrange
        var customers = Enumerable.Range(1, 10).Select(i => new Customer
        {
            Id = Guid.NewGuid(),
            Name = $"Customer {i}",
            Email = $"customer{i}@example.com",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        }).ToList();

        _mockRepository
            .Setup(r => r.GetAllAsync(0, 10, null, null, null))
            .ReturnsAsync((customers, 50));

        // Act
        var result = await _controller.GetCustomers();

        // Assert
        var okResult = result.Result as OkObjectResult;
        var response = okResult!.Value as PaginatedResponseDto<CustomerResponseDto>;

        response!.Items.Should().HaveCount(10);
        response.TotalCount.Should().Be(50);
        response.TotalPages.Should().Be(5);
    }

    #endregion
}
