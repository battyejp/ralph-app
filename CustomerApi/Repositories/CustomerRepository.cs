using CustomerApi.Data;
using CustomerApi.Models;
using Microsoft.EntityFrameworkCore;

namespace CustomerApi.Repositories;

public class CustomerRepository : ICustomerRepository
{
    private readonly ApplicationDbContext _context;

    public CustomerRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Customer?> GetByIdAsync(Guid id)
    {
        return await _context.Customers
            .FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);
    }

    public async Task<Customer?> GetByEmailAsync(string email)
    {
        return await _context.Customers
            .FirstOrDefaultAsync(c => c.Email == email && !c.IsDeleted);
    }

    public async Task<(IEnumerable<Customer> Items, int TotalCount)> GetAllAsync(
        int skip,
        int take,
        string? searchTerm = null,
        DateTime? dateFrom = null,
        DateTime? dateTo = null)
    {
        var query = _context.Customers.Where(c => !c.IsDeleted);

        // Apply search filter (name or email)
        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var search = searchTerm.ToLower();
            query = query.Where(c =>
                c.Name.ToLower().Contains(search) ||
                c.Email.ToLower().Contains(search));
        }

        // Apply date range filter on CreatedAt
        if (dateFrom.HasValue)
        {
            query = query.Where(c => c.CreatedAt >= dateFrom.Value);
        }

        if (dateTo.HasValue)
        {
            query = query.Where(c => c.CreatedAt <= dateTo.Value);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(c => c.Name)
            .Skip(skip)
            .Take(take)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<Customer> CreateAsync(Customer customer)
    {
        _context.Customers.Add(customer);
        await _context.SaveChangesAsync();
        return customer;
    }

    public async Task<Customer> UpdateAsync(Customer customer)
    {
        _context.Customers.Update(customer);
        await _context.SaveChangesAsync();
        return customer;
    }

    public async Task DeleteAsync(Customer customer)
    {
        // Soft delete - set IsDeleted flag to true
        customer.IsDeleted = true;
        _context.Customers.Update(customer);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> ExistsAsync(Guid id)
    {
        return await _context.Customers
            .AnyAsync(c => c.Id == id && !c.IsDeleted);
    }
}
