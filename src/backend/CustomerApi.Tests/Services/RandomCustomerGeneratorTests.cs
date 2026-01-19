using CustomerApi.Services;
using FluentAssertions;

namespace CustomerApi.Tests.Services;

public class RandomCustomerGeneratorTests
{
    private readonly IRandomCustomerGenerator _generator;

    public RandomCustomerGeneratorTests()
    {
        _generator = new RandomCustomerGenerator();
    }

    [Fact]
    public void GenerateCustomers_WithValidCount_ReturnsCorrectNumberOfCustomers()
    {
        var count = 10;

        var customers = _generator.GenerateCustomers(count);

        customers.Should().HaveCount(count);
    }

    [Fact]
    public void GenerateCustomers_WithSingleCustomer_ReturnsOneCustomer()
    {
        var count = 1;

        var customers = _generator.GenerateCustomers(count);

        customers.Should().HaveCount(count);
    }

    [Fact]
    public void GenerateCustomers_WithLargeCount_ReturnsCorrectNumberOfCustomers()
    {
        var count = 1000;

        var customers = _generator.GenerateCustomers(count);

        customers.Should().HaveCount(count);
    }

    [Fact]
    public void GenerateCustomers_GeneratesUniqueEmails()
    {
        var count = 100;

        var customers = _generator.GenerateCustomers(count);

        var emails = customers.Select(c => c.Email).ToList();
        var uniqueEmails = emails.Distinct().ToList();

        uniqueEmails.Should().HaveCount(emails.Count, "all emails should be unique");
    }

    [Fact]
    public void GenerateCustomers_AllCustomersHaveRequiredFields()
    {
        var count = 50;

        var customers = _generator.GenerateCustomers(count);

        customers.Should().AllSatisfy(customer =>
        {
            customer.Name.Should().NotBeNullOrWhiteSpace("name is required");
            customer.Email.Should().NotBeNullOrWhiteSpace("email is required");
        });
    }

    [Fact]
    public void GenerateCustomers_AllNamesContainFirstAndLastName()
    {
        var count = 50;

        var customers = _generator.GenerateCustomers(count);

        customers.Should().AllSatisfy(customer =>
        {
            customer.Name.Should().Contain(" ", "name should contain space between first and last name");
            customer.Name.Split(' ').Should().HaveCount(2, "name should have first and last name");
        });
    }

    [Fact]
    public void GenerateCustomers_AllEmailsHaveValidFormat()
    {
        var count = 50;

        var customers = _generator.GenerateCustomers(count);

        customers.Should().AllSatisfy(customer =>
        {
            customer.Email.Should().Contain("@", "email should contain @ symbol");
            customer.Email.Should().Contain(".", "email should contain domain extension");
            customer.Email.Split('@').Should().HaveCount(2, "email should have local and domain parts");
        });
    }

    [Fact]
    public void GenerateCustomers_AllPhoneNumbersHaveValidFormat()
    {
        var count = 50;

        var customers = _generator.GenerateCustomers(count);

        customers.Should().AllSatisfy(customer =>
        {
            customer.Phone.Should().NotBeNullOrWhiteSpace("phone should be generated");
            customer.Phone.Should().StartWith("+1-", "phone should start with country code");
            customer.Phone.Should().MatchRegex(@"^\+1-\d{3}-\d{3}-\d{4}$", "phone should match format +1-XXX-XXX-XXXX");
        });
    }

    [Fact]
    public void GenerateCustomers_AllAddressesContainRequiredComponents()
    {
        var count = 50;

        var customers = _generator.GenerateCustomers(count);

        customers.Should().AllSatisfy(customer =>
        {
            customer.Address.Should().NotBeNullOrWhiteSpace("address should be generated");
            customer.Address.Should().Contain(",", "address should contain commas separating components");

            var parts = customer.Address.Split(',');
            parts.Length.Should().BeGreaterThanOrEqualTo(3, "address should have street, city, state/postal, and country");
        });
    }

    [Fact]
    public void GenerateCustomers_GeneratesVariedData()
    {
        var count = 100;

        var customers = _generator.GenerateCustomers(count);

        // Check that we have variety in the generated data
        var uniqueNames = customers.Select(c => c.Name).Distinct().Count();
        var uniqueDomains = customers.Select(c => c.Email.Split('@')[1]).Distinct().Count();
        var uniqueCities = customers.Select(c =>
        {
            var addressParts = c.Address!.Split(',');
            return addressParts.Length > 1 ? addressParts[1].Trim() : "";
        }).Distinct().Count();

        uniqueNames.Should().BeGreaterThan(50, "names should be varied");
        uniqueDomains.Should().BeGreaterThan(1, "email domains should be varied");
        uniqueCities.Should().BeGreaterThan(1, "cities should be varied");
    }

    [Fact]
    public void GenerateCustomers_WithZeroCount_ReturnsEmptyList()
    {
        var count = 0;

        var customers = _generator.GenerateCustomers(count);

        customers.Should().BeEmpty();
    }

    [Fact]
    public void GenerateCustomers_AllFieldsWithinValidationLimits()
    {
        var count = 50;

        var customers = _generator.GenerateCustomers(count);

        customers.Should().AllSatisfy(customer =>
        {
            customer.Name.Length.Should().BeLessThanOrEqualTo(100, "name should not exceed max length");
            customer.Email.Length.Should().BeLessThanOrEqualTo(255, "email should not exceed reasonable length");
            customer.Phone!.Length.Should().BeLessThanOrEqualTo(20, "phone should not exceed max length");
            customer.Address!.Length.Should().BeLessThanOrEqualTo(500, "address should not exceed max length");
        });
    }

    [Fact]
    public void GenerateCustomers_EmailsAreLowercase()
    {
        var count = 50;

        var customers = _generator.GenerateCustomers(count);

        customers.Should().AllSatisfy(customer =>
        {
            var localPart = customer.Email.Split('@')[0];
            // Check that letters in email are lowercase (numbers and dots are allowed)
            localPart.Where(char.IsLetter).Should().AllSatisfy(c =>
            {
                char.IsLower(c).Should().BeTrue("email should be lowercase");
            });
        });
    }

    [Fact]
    public void GenerateCustomers_MultipleCallsGenerateDifferentData()
    {
        var count = 10;

        var customers1 = _generator.GenerateCustomers(count);
        var customers2 = _generator.GenerateCustomers(count);

        // At least some customers should be different between calls
        var emails1 = customers1.Select(c => c.Email).ToHashSet();
        var emails2 = customers2.Select(c => c.Email).ToHashSet();

        var differentEmails = emails1.Where(e => !emails2.Contains(e)).Count() +
                             emails2.Where(e => !emails1.Contains(e)).Count();

        differentEmails.Should().BeGreaterThan(0, "different calls should generate some different data");
    }
}
