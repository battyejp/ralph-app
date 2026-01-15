using AutoMapper;
using CustomerApi.DTOs;
using CustomerApi.Models;
using CustomerApi.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace CustomerApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly ICustomerRepository _repository;
    private readonly IMapper _mapper;

    public CustomersController(ICustomerRepository repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    /// <summary>
    /// Gets a paginated list of customers
    /// </summary>
    /// <param name="page">Page number (default 1, minimum 1)</param>
    /// <param name="pageSize">Number of items per page (default 10, max 100)</param>
    /// <returns>Paginated list of customers</returns>
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResponseDto<CustomerResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PaginatedResponseDto<CustomerResponseDto>>> GetCustomers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        // Validate and normalize parameters
        if (page < 1)
        {
            page = 1;
        }

        if (pageSize < 1)
        {
            pageSize = 10;
        }
        else if (pageSize > 100)
        {
            pageSize = 100;
        }

        // Calculate skip
        int skip = (page - 1) * pageSize;

        // Get paginated data from repository
        var (customers, totalCount) = await _repository.GetAllAsync(skip, pageSize);

        // Map to response DTOs
        var customerDtos = _mapper.Map<IEnumerable<CustomerResponseDto>>(customers);

        // Calculate total pages
        int totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        // Create paginated response
        var response = new PaginatedResponseDto<CustomerResponseDto>
        {
            Items = customerDtos,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = totalPages
        };

        return Ok(response);
    }

    /// <summary>
    /// Gets a customer by ID
    /// </summary>
    /// <param name="id">Customer GUID identifier</param>
    /// <returns>The customer if found</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(CustomerResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CustomerResponseDto>> GetCustomerById(Guid id)
    {
        var customer = await _repository.GetByIdAsync(id);

        if (customer == null)
        {
            return NotFound(new { message = $"Customer with ID {id} not found." });
        }

        var responseDto = _mapper.Map<CustomerResponseDto>(customer);
        return Ok(responseDto);
    }

    /// <summary>
    /// Creates a new customer
    /// </summary>
    /// <param name="createDto">Customer creation data</param>
    /// <returns>The created customer</returns>
    [HttpPost]
    [ProducesResponseType(typeof(CustomerResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CustomerResponseDto>> CreateCustomer([FromBody] CreateCustomerDto createDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Map DTO to entity
        var customer = _mapper.Map<Customer>(createDto);

        // Set timestamps
        customer.Id = Guid.NewGuid();
        customer.CreatedAt = DateTime.UtcNow;
        customer.UpdatedAt = DateTime.UtcNow;

        // Save to database
        var createdCustomer = await _repository.CreateAsync(customer);

        // Map to response DTO
        var responseDto = _mapper.Map<CustomerResponseDto>(createdCustomer);

        // Return 201 Created with Location header
        return CreatedAtAction(
            nameof(CreateCustomer),
            new { id = createdCustomer.Id },
            responseDto);
    }
}
