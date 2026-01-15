using CustomerApi.Data;
using CustomerApi.Models;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;

namespace CustomerApi.Tests.Data;

public class ApplicationDbContextTests
{
    private ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    [Fact]
    public void DbContext_CanAddCustomer()
    {
        using var context = CreateContext();
        var customer = new Customer
        {
            Id = Guid.NewGuid(),
            Name = "Test Customer",
            Email = "test@example.com",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Customers.Add(customer);
        var saveResult = context.SaveChanges();

        saveResult.Should().Be(1);
        context.Customers.Should().HaveCount(1);
    }

    [Fact]
    public void DbContext_CanRetrieveCustomer()
    {
        using var context = CreateContext();
        var customerId = Guid.NewGuid();
        var customer = new Customer
        {
            Id = customerId,
            Name = "Test Customer",
            Email = "test@example.com",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Customers.Add(customer);
        context.SaveChanges();

        var retrieved = context.Customers.Find(customerId);

        retrieved.Should().NotBeNull();
        retrieved!.Name.Should().Be("Test Customer");
        retrieved.Email.Should().Be("test@example.com");
    }

    [Fact]
    public void DbContext_CanUpdateCustomer()
    {
        using var context = CreateContext();
        var customer = new Customer
        {
            Id = Guid.NewGuid(),
            Name = "Original Name",
            Email = "test@example.com",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Customers.Add(customer);
        context.SaveChanges();

        customer.Name = "Updated Name";
        context.SaveChanges();

        var retrieved = context.Customers.Find(customer.Id);
        retrieved!.Name.Should().Be("Updated Name");
    }

    [Fact]
    public void DbContext_CanDeleteCustomer()
    {
        using var context = CreateContext();
        var customer = new Customer
        {
            Id = Guid.NewGuid(),
            Name = "Test Customer",
            Email = "test@example.com",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Customers.Add(customer);
        context.SaveChanges();

        context.Customers.Remove(customer);
        context.SaveChanges();

        context.Customers.Should().BeEmpty();
    }

    [Fact]
    public void DbContext_Name_IsRequired()
    {
        using var context = CreateContext();
        var customer = new Customer
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Customers.Add(customer);
        context.SaveChanges(); // InMemory doesn't enforce constraints

        // Verify the model configuration
        var entityType = context.Model.FindEntityType(typeof(Customer));
        var nameProperty = entityType!.FindProperty(nameof(Customer.Name));
        nameProperty!.IsNullable.Should().BeFalse();
    }

    [Fact]
    public void DbContext_Name_HasMaxLength100()
    {
        using var context = CreateContext();

        var entityType = context.Model.FindEntityType(typeof(Customer));
        var nameProperty = entityType!.FindProperty(nameof(Customer.Name));
        nameProperty!.GetMaxLength().Should().Be(100);
    }

    [Fact]
    public void DbContext_Email_IsRequired()
    {
        using var context = CreateContext();

        var entityType = context.Model.FindEntityType(typeof(Customer));
        var emailProperty = entityType!.FindProperty(nameof(Customer.Email));
        emailProperty!.IsNullable.Should().BeFalse();
    }

    [Fact]
    public void DbContext_Email_HasUniqueIndex()
    {
        using var context = CreateContext();

        var entityType = context.Model.FindEntityType(typeof(Customer));
        var emailIndex = entityType!.FindIndex(entityType.FindProperty(nameof(Customer.Email))!);
        emailIndex.Should().NotBeNull();
        emailIndex!.IsUnique.Should().BeTrue();
    }

    [Fact]
    public void DbContext_Phone_HasMaxLength20()
    {
        using var context = CreateContext();

        var entityType = context.Model.FindEntityType(typeof(Customer));
        var phoneProperty = entityType!.FindProperty(nameof(Customer.Phone));
        phoneProperty!.GetMaxLength().Should().Be(20);
    }

    [Fact]
    public void DbContext_Address_HasMaxLength500()
    {
        using var context = CreateContext();

        var entityType = context.Model.FindEntityType(typeof(Customer));
        var addressProperty = entityType!.FindProperty(nameof(Customer.Address));
        addressProperty!.GetMaxLength().Should().Be(500);
    }

    [Fact]
    public void DbContext_Phone_IsOptional()
    {
        using var context = CreateContext();

        var entityType = context.Model.FindEntityType(typeof(Customer));
        var phoneProperty = entityType!.FindProperty(nameof(Customer.Phone));
        phoneProperty!.IsNullable.Should().BeTrue();
    }

    [Fact]
    public void DbContext_Address_IsOptional()
    {
        using var context = CreateContext();

        var entityType = context.Model.FindEntityType(typeof(Customer));
        var addressProperty = entityType!.FindProperty(nameof(Customer.Address));
        addressProperty!.IsNullable.Should().BeTrue();
    }

    [Fact]
    public async Task DbContext_CanQueryCustomersAsync()
    {
        using var context = CreateContext();
        var customer1 = new Customer
        {
            Id = Guid.NewGuid(),
            Name = "Customer One",
            Email = "one@example.com",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var customer2 = new Customer
        {
            Id = Guid.NewGuid(),
            Name = "Customer Two",
            Email = "two@example.com",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Customers.AddRange(customer1, customer2);
        await context.SaveChangesAsync();

        var customers = await context.Customers.ToListAsync();
        customers.Should().HaveCount(2);
    }

    [Fact]
    public void DbContext_Customer_HasPrimaryKey()
    {
        using var context = CreateContext();

        var entityType = context.Model.FindEntityType(typeof(Customer));
        var primaryKey = entityType!.FindPrimaryKey();
        primaryKey.Should().NotBeNull();
        primaryKey!.Properties.Should().ContainSingle(p => p.Name == nameof(Customer.Id));
    }
}
