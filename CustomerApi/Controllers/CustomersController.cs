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
