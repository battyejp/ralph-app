using CustomerApi.Data;
using CustomerApi.Models;
using CustomerApi.Repositories;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;

namespace CustomerApi.Tests.Repositories;

public class CustomerRepositoryTests
{
    private ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    private Customer CreateTestCustomer(string name = "Test Customer", string email = "test@example.com")
    {
        return new Customer
        {
            Id = Guid.NewGuid(),
            Name = name,
            Email = email,
            Phone = "+1234567890",
            Address = "123 Test St",
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = "test-user",
            UpdatedBy = "test-user"
        };
    }

    #region GetByIdAsync Tests

    [Fact]
    public async Task GetByIdAsync_ExistingCustomer_ReturnsCustomer()
    {
        using var context = CreateContext();
        var customer = CreateTestCustomer();
        context.Customers.Add(customer);
        await context.SaveChangesAsync();
        var repository = new CustomerRepository(context);

        var result = await repository.GetByIdAsync(customer.Id);

        result.Should().NotBeNull();
        result!.Id.Should().Be(customer.Id);
        result.Name.Should().Be(customer.Name);
        result.Email.Should().Be(customer.Email);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingCustomer_ReturnsNull()
    {
        using var context = CreateContext();
        var repository = new CustomerRepository(context);

        var result = await repository.GetByIdAsync(Guid.NewGuid());

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetByIdAsync_DeletedCustomer_ReturnsNull()
    {
        using var context = CreateContext();
        var customer = CreateTestCustomer();
        customer.IsDeleted = true;
        context.Customers.Add(customer);
        await context.SaveChangesAsync();
        var repository = new CustomerRepository(context);

        var result = await repository.GetByIdAsync(customer.Id);

        result.Should().BeNull();
    }

    #endregion

    #region GetByEmailAsync Tests

    [Fact]
    public async Task GetByEmailAsync_ExistingEmail_ReturnsCustomer()
    {
        using var context = CreateContext();
        var customer = CreateTestCustomer();
        context.Customers.Add(customer);
        await context.SaveChangesAsync();
        var repository = new CustomerRepository(context);

        var result = await repository.GetByEmailAsync(customer.Email);

        result.Should().NotBeNull();
        result!.Email.Should().Be(customer.Email);
    }

    [Fact]
    public async Task GetByEmailAsync_NonExistingEmail_ReturnsNull()
    {
        using var context = CreateContext();
        var repository = new CustomerRepository(context);

        var result = await repository.GetByEmailAsync("nonexistent@example.com");

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetByEmailAsync_DeletedCustomer_ReturnsNull()
    {
        using var context = CreateContext();
        var customer = CreateTestCustomer();
        customer.IsDeleted = true;
        context.Customers.Add(customer);
        await context.SaveChangesAsync();
        var repository = new CustomerRepository(context);

        var result = await repository.GetByEmailAsync(customer.Email);

        result.Should().BeNull();
    }

    #endregion

    #region GetAllAsync Tests

    [Fact]
    public async Task GetAllAsync_ReturnsAllNonDeletedCustomers()
    {
        using var context = CreateContext();
        var customer1 = CreateTestCustomer("Customer One", "one@example.com");
        var customer2 = CreateTestCustomer("Customer Two", "two@example.com");
        var deletedCustomer = CreateTestCustomer("Deleted Customer", "deleted@example.com");
        deletedCustomer.IsDeleted = true;

        context.Customers.AddRange(customer1, customer2, deletedCustomer);
        await context.SaveChangesAsync();
        var repository = new CustomerRepository(context);

        var (items, totalCount) = await repository.GetAllAsync(0, 10);

        items.Should().HaveCount(2);
        totalCount.Should().Be(2);
    }

    [Fact]
    public async Task GetAllAsync_WithPagination_ReturnsCorrectPage()
    {
        using var context = CreateContext();
        for (int i = 0; i < 15; i++)
        {
            context.Customers.Add(CreateTestCustomer($"Customer {i:D2}", $"customer{i}@example.com"));
        }
        await context.SaveChangesAsync();
        var repository = new CustomerRepository(context);

        var (items, totalCount) = await repository.GetAllAsync(skip: 5, take: 5);

        items.Should().HaveCount(5);
        totalCount.Should().Be(15);
    }

    [Fact]
    public async Task GetAllAsync_WithPagination_SkipBeyondTotal_ReturnsEmpty()
    {
        using var context = CreateContext();
        context.Customers.Add(CreateTestCustomer());
        await context.SaveChangesAsync();
        var repository = new CustomerRepository(context);

        var (items, totalCount) = await repository.GetAllAsync(skip: 10, take: 5);

        items.Should().BeEmpty();
        totalCount.Should().Be(1);
    }

    [Fact]
    public async Task GetAllAsync_ResultsOrderedByName()
    {
        using var context = CreateContext();
        context.Customers.Add(CreateTestCustomer("Zebra Company", "zebra@example.com"));
        context.Customers.Add(CreateTestCustomer("Alpha Corp", "alpha@example.com"));
        context.Customers.Add(CreateTestCustomer("Beta Inc", "beta@example.com"));
        await context.SaveChangesAsync();
        var repository = new CustomerRepository(context);

        var (items, _) = await repository.GetAllAsync(0, 10, null, null, null, null, "name", "asc");

        var customerList = items.ToList();
        customerList[0].Name.Should().Be("Alpha Corp");
        customerList[1].Name.Should().Be("Beta Inc");
        customerList[2].Name.Should().Be("Zebra Company");
    }

    #endregion

    #region Search Tests

    [Fact]
    public async Task GetAllAsync_SearchByName_ReturnsMatchingCustomers()
    {
        using var context = CreateContext();
        context.Customers.Add(CreateTestCustomer("John Smith", "john@example.com"));
        context.Customers.Add(CreateTestCustomer("Jane Doe", "jane@example.com"));
        context.Customers.Add(CreateTestCustomer("Bob Johnson", "bob@example.com"));
        await context.SaveChangesAsync();
        var repository = new CustomerRepository(context);

        var (items, totalCount) = await repository.GetAllAsync(0, 10, searchTerm: "John");

        items.Should().HaveCount(2);
        totalCount.Should().Be(2);
        items.Should().Contain(c => c.Name == "John Smith");
        items.Should().Contain(c => c.Name == "Bob Johnson");
    }

    [Fact]
    public async Task GetAllAsync_SearchByEmail_ReturnsMatchingCustomers()
    {
        using var context = CreateContext();
        context.Customers.Add(CreateTestCustomer("Customer One", "john.smith@company.com"));
        context.Customers.Add(CreateTestCustomer("Customer Two", "jane.doe@othercompany.com"));
        await context.SaveChangesAsync();
        var repository = new CustomerRepository(context);

        var (items, totalCount) = await repository.GetAllAsync(0, 10, searchTerm: "company.com");

        items.Should().HaveCount(2);
        totalCount.Should().Be(2);
    }

    [Fact]
    public async Task GetAllAsync_SearchIsCaseInsensitive()
    {
        using var context = CreateContext();
        context.Customers.Add(CreateTestCustomer("JOHN SMITH", "john@example.com"));
        await context.SaveChangesAsync();
        var repository = new CustomerRepository(context);

        var (items, totalCount) = await repository.GetAllAsync(0, 10, searchTerm: "john smith");

        items.Should().HaveCount(1);
        totalCount.Should().Be(1);
    }

    [Fact]
    public async Task GetAllAsync_SearchWithNoMatches_ReturnsEmpty()
    {
        using var context = CreateContext();
        context.Customers.Add(CreateTestCustomer("John Smith", "john@example.com"));
        await context.SaveChangesAsync();
        var repository = new CustomerRepository(context);

        var (items, totalCount) = await repository.GetAllAsync(0, 10, searchTerm: "nonexistent");

        items.Should().BeEmpty();
        totalCount.Should().Be(0);
    }

    [Fact]
    public async Task GetAllAsync_SearchWithEmptyString_ReturnsAll()
    {
        using var context = CreateContext();
        context.Customers.Add(CreateTestCustomer("Customer One", "one@example.com"));
        context.Customers.Add(CreateTestCustomer("Customer Two", "two@example.com"));
        await context.SaveChangesAsync();
        var repository = new CustomerRepository(context);

        var (items, totalCount) = await repository.GetAllAsync(0, 10, searchTerm: "");

        items.Should().HaveCount(2);
        totalCount.Should().Be(2);
    }

    [Fact]
    public async Task GetAllAsync_SearchWithWhitespace_ReturnsAll()
    {
        using var context = CreateContext();
        context.Customers.Add(CreateTestCustomer("Customer One", "one@example.com"));
        await context.SaveChangesAsync();
        var repository = new CustomerRepository(context);

        var (items, totalCount) = await repository.GetAllAsync(0, 10, searchTerm: "   ");

        items.Should().HaveCount(1);
        totalCount.Should().Be(1);
    }

    #endregion

    #region Date Filter Tests

    [Fact]
    public async Task GetAllAsync_FilterByDateFrom_ReturnsCustomersCreatedAfter()
    {
        using var context = CreateContext();
        var oldDate = DateTime.UtcNow.AddDays(-10);
        var recentDate = DateTime.UtcNow.AddDays(-1);

        var oldCustomer = CreateTestCustomer("Old Customer", "old@example.com");
        oldCustomer.CreatedAt = oldDate;
        var recentCustomer = CreateTestCustomer("Recent Customer", "recent@example.com");
        recentCustomer.CreatedAt = recentDate;

        context.Customers.AddRange(oldCustomer, recentCustomer);
        await context.SaveChangesAsync();
        var repository = new CustomerRepository(context);

        var (items, totalCount) = await repository.GetAllAsync(0, 10, dateFrom: DateTime.UtcNow.AddDays(-5));

        items.Should().HaveCount(1);
        totalCount.Should().Be(1);
        items.First().Name.Should().Be("Recent Customer");
    }

    [Fact]
    public async Task GetAllAsync_FilterByDateTo_ReturnsCustomersCreatedBefore()
    {
        using var context = CreateContext();
        var oldDate = DateTime.UtcNow.AddDays(-10);
        var recentDate = DateTime.UtcNow.AddDays(-1);

        var oldCustomer = CreateTestCustomer("Old Customer", "old@example.com");
        oldCustomer.CreatedAt = oldDate;
        var recentCustomer = CreateTestCustomer("Recent Customer", "recent@example.com");
        recentCustomer.CreatedAt = recentDate;

        context.Customers.AddRange(oldCustomer, recentCustomer);
        await context.SaveChangesAsync();
        var repository = new CustomerRepository(context);

        var (items, totalCount) = await repository.GetAllAsync(0, 10, dateTo: DateTime.UtcNow.AddDays(-5));

        items.Should().HaveCount(1);
        totalCount.Should().Be(1);
        items.First().Name.Should().Be("Old Customer");
    }

    [Fact]
    public async Task GetAllAsync_FilterByDateRange_ReturnsCustomersWithinRange()
    {
        using var context = CreateContext();
        var oldDate = DateTime.UtcNow.AddDays(-20);
        var midDate = DateTime.UtcNow.AddDays(-10);
        var recentDate = DateTime.UtcNow.AddDays(-1);

        var oldCustomer = CreateTestCustomer("Old Customer", "old@example.com");
        oldCustomer.CreatedAt = oldDate;
        var midCustomer = CreateTestCustomer("Mid Customer", "mid@example.com");
        midCustomer.CreatedAt = midDate;
        var recentCustomer = CreateTestCustomer("Recent Customer", "recent@example.com");
        recentCustomer.CreatedAt = recentDate;

        context.Customers.AddRange(oldCustomer, midCustomer, recentCustomer);
        await context.SaveChangesAsync();
        var repository = new CustomerRepository(context);

        var (items, totalCount) = await repository.GetAllAsync(
            0, 10,
            dateFrom: DateTime.UtcNow.AddDays(-15),
            dateTo: DateTime.UtcNow.AddDays(-5));

        items.Should().HaveCount(1);
        totalCount.Should().Be(1);
        items.First().Name.Should().Be("Mid Customer");
    }

    [Fact]
    public async Task GetAllAsync_CombineSearchAndDateFilter_ReturnsMatchingCustomers()
    {
        using var context = CreateContext();
        var oldDate = DateTime.UtcNow.AddDays(-10);
        var recentDate = DateTime.UtcNow.AddDays(-1);

        var oldJohn = CreateTestCustomer("John Old", "johnold@example.com");
        oldJohn.CreatedAt = oldDate;
        var recentJohn = CreateTestCustomer("John Recent", "johnrecent@example.com");
        recentJohn.CreatedAt = recentDate;
        var recentJane = CreateTestCustomer("Jane Recent", "janerecent@example.com");
        recentJane.CreatedAt = recentDate;

        context.Customers.AddRange(oldJohn, recentJohn, recentJane);
        await context.SaveChangesAsync();
        var repository = new CustomerRepository(context);

        var (items, totalCount) = await repository.GetAllAsync(
            0, 10,
            searchTerm: "John",
            dateFrom: DateTime.UtcNow.AddDays(-5));

        items.Should().HaveCount(1);
        totalCount.Should().Be(1);
        items.First().Name.Should().Be("John Recent");
    }

    #endregion

    #region CreateAsync Tests

    [Fact]
    public async Task CreateAsync_ValidCustomer_SavesAndReturnsCustomer()
    {
        using var context = CreateContext();
        var repository = new CustomerRepository(context);
        var customer = CreateTestCustomer();

        var result = await repository.CreateAsync(customer);

        result.Should().NotBeNull();
        result.Id.Should().Be(customer.Id);

        var saved = await context.Customers.FindAsync(customer.Id);
        saved.Should().NotBeNull();
        saved!.Name.Should().Be(customer.Name);
    }

    [Fact]
    public async Task CreateAsync_AssignsId_WhenEmpty()
    {
        using var context = CreateContext();
        var repository = new CustomerRepository(context);
        var customer = CreateTestCustomer();
        var expectedId = customer.Id;

        var result = await repository.CreateAsync(customer);

        result.Id.Should().Be(expectedId);
    }

    #endregion

    #region UpdateAsync Tests

    [Fact]
    public async Task UpdateAsync_ExistingCustomer_UpdatesAndReturnsCustomer()
    {
        using var context = CreateContext();
        var customer = CreateTestCustomer();
        context.Customers.Add(customer);
        await context.SaveChangesAsync();
        var repository = new CustomerRepository(context);

        customer.Name = "Updated Name";
        customer.Phone = "+9876543210";
        var result = await repository.UpdateAsync(customer);

        result.Name.Should().Be("Updated Name");
        result.Phone.Should().Be("+9876543210");

        var saved = await context.Customers.FindAsync(customer.Id);
        saved!.Name.Should().Be("Updated Name");
        saved.Phone.Should().Be("+9876543210");
    }

    #endregion

    #region DeleteAsync Tests

    [Fact]
    public async Task DeleteAsync_SetsIsDeletedToTrue()
    {
        using var context = CreateContext();
        var customer = CreateTestCustomer();
        context.Customers.Add(customer);
        await context.SaveChangesAsync();
        var repository = new CustomerRepository(context);

        await repository.DeleteAsync(customer);

        var saved = await context.Customers.FindAsync(customer.Id);
        saved.Should().NotBeNull();
        saved!.IsDeleted.Should().BeTrue();
    }

    [Fact]
    public async Task DeleteAsync_CustomerStillExistsInDatabase()
    {
        using var context = CreateContext();
        var customer = CreateTestCustomer();
        context.Customers.Add(customer);
        await context.SaveChangesAsync();
        var repository = new CustomerRepository(context);

        await repository.DeleteAsync(customer);

        // Customer should still exist in database (soft delete)
        var allCustomers = await context.Customers.ToListAsync();
        allCustomers.Should().HaveCount(1);
        allCustomers.First().IsDeleted.Should().BeTrue();
    }

    [Fact]
    public async Task DeleteAsync_DeletedCustomerNotReturnedByGetById()
    {
        using var context = CreateContext();
        var customer = CreateTestCustomer();
        context.Customers.Add(customer);
        await context.SaveChangesAsync();
        var repository = new CustomerRepository(context);

        await repository.DeleteAsync(customer);

        var result = await repository.GetByIdAsync(customer.Id);
        result.Should().BeNull();
    }

    #endregion

    #region ExistsAsync Tests

    [Fact]
    public async Task ExistsAsync_ExistingCustomer_ReturnsTrue()
    {
        using var context = CreateContext();
        var customer = CreateTestCustomer();
        context.Customers.Add(customer);
        await context.SaveChangesAsync();
        var repository = new CustomerRepository(context);

        var result = await repository.ExistsAsync(customer.Id);

        result.Should().BeTrue();
    }

    [Fact]
    public async Task ExistsAsync_NonExistingCustomer_ReturnsFalse()
    {
        using var context = CreateContext();
        var repository = new CustomerRepository(context);

        var result = await repository.ExistsAsync(Guid.NewGuid());

        result.Should().BeFalse();
    }

    [Fact]
    public async Task ExistsAsync_DeletedCustomer_ReturnsFalse()
    {
        using var context = CreateContext();
        var customer = CreateTestCustomer();
        customer.IsDeleted = true;
        context.Customers.Add(customer);
        await context.SaveChangesAsync();
        var repository = new CustomerRepository(context);

        var result = await repository.ExistsAsync(customer.Id);

        result.Should().BeFalse();
    }

    #endregion

    #region Empty Database Tests

    [Fact]
    public async Task GetAllAsync_EmptyDatabase_ReturnsEmptyListAndZeroCount()
    {
        using var context = CreateContext();
        var repository = new CustomerRepository(context);

        var (items, totalCount) = await repository.GetAllAsync(0, 10);

        items.Should().BeEmpty();
        totalCount.Should().Be(0);
    }

    #endregion
}
