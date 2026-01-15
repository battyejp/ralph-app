using CustomerApi.Models;

namespace CustomerApi.Repositories;

public interface ICustomerRepository
{
    Task<Customer?> GetByIdAsync(Guid id);
    Task<Customer?> GetByEmailAsync(string email);
    Task<(IEnumerable<Customer> Items, int TotalCount)> GetAllAsync(
        int skip,
        int take,
        string? searchTerm = null,
        string? emailFilter = null,
        DateTime? dateFrom = null,
        DateTime? dateTo = null,
        string? sortBy = null,
        string? sortOrder = null);
    Task<Customer> CreateAsync(Customer customer);
    Task<Customer> UpdateAsync(Customer customer);
    Task DeleteAsync(Customer customer);
    Task<bool> ExistsAsync(Guid id);
}
