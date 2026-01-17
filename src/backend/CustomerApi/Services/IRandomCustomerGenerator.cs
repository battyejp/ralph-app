using CustomerApi.DTOs;

namespace CustomerApi.Services;

/// <summary>
/// Service interface for generating random customer data
/// </summary>
public interface IRandomCustomerGenerator
{
    /// <summary>
    /// Generates a list of random customers with realistic data
    /// </summary>
    /// <param name="count">Number of customers to generate</param>
    /// <returns>List of CreateCustomerDto objects with unique email addresses</returns>
    List<CreateCustomerDto> GenerateCustomers(int count);
}
