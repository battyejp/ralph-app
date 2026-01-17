using CustomerApi.DTOs;

namespace CustomerApi.Services;

/// <summary>
/// Service for generating random customer data with realistic names, emails, phone numbers, and addresses
/// </summary>
public class RandomCustomerGenerator : IRandomCustomerGenerator
{
    private readonly Random _random = new Random();

    private readonly string[] _firstNames = new[]
    {
        "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
        "William", "Barbara", "David", "Elizabeth", "Richard", "Susan", "Joseph", "Jessica",
        "Thomas", "Sarah", "Christopher", "Karen", "Charles", "Nancy", "Daniel", "Lisa",
        "Matthew", "Margaret", "Anthony", "Betty", "Mark", "Sandra", "Donald", "Ashley",
        "Steven", "Kimberly", "Andrew", "Emily", "Paul", "Donna", "Joshua", "Michelle",
        "Kenneth", "Carol", "Kevin", "Amanda", "Brian", "Melissa", "George", "Deborah",
        "Timothy", "Stephanie", "Ronald", "Dorothy", "Edward", "Rebecca", "Jason", "Sharon",
        "Jeffrey", "Laura", "Ryan", "Cynthia", "Jacob", "Amy"
    };

    private readonly string[] _lastNames = new[]
    {
        "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
        "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas",
        "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White",
        "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young",
        "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
        "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell",
        "Carter", "Roberts", "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker",
        "Cruz", "Edwards", "Collins", "Reyes", "Stewart", "Morris", "Morales", "Murphy"
    };

    private readonly string[] _emailDomains = new[]
    {
        "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com",
        "aol.com", "protonmail.com", "mail.com", "zoho.com", "gmx.com"
    };

    private readonly string[] _streets = new[]
    {
        "Main St", "Oak Ave", "Maple Dr", "Park Blvd", "Cedar Ln",
        "Elm St", "Washington Ave", "Lake Rd", "Hill St", "Pine Ct",
        "First St", "Second Ave", "Third St", "Fourth Ave", "Fifth St",
        "Broadway", "Market St", "Church St", "Walnut St", "Chestnut St"
    };

    private readonly string[] _cities = new[]
    {
        "New York", "Los Angeles", "Chicago", "Houston", "Phoenix",
        "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose",
        "Austin", "Jacksonville", "Fort Worth", "Columbus", "Charlotte",
        "San Francisco", "Indianapolis", "Seattle", "Denver", "Boston",
        "Portland", "Nashville", "Memphis", "Detroit", "Baltimore"
    };

    private readonly string[] _states = new[]
    {
        "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
        "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
        "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
        "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
        "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
    };

    private readonly string[] _countries = new[]
    {
        "United States", "Canada", "United Kingdom", "Australia", "Germany",
        "France", "Spain", "Italy", "Netherlands", "Sweden"
    };

    /// <inheritdoc />
    public List<CreateCustomerDto> GenerateCustomers(int count)
    {
        var customers = new List<CreateCustomerDto>();
        var usedEmails = new HashSet<string>();

        for (int i = 0; i < count; i++)
        {
            var firstName = _firstNames[_random.Next(_firstNames.Length)];
            var lastName = _lastNames[_random.Next(_lastNames.Length)];
            var name = $"{firstName} {lastName}";

            // Generate unique email
            var email = GenerateUniqueEmail(firstName, lastName, i, usedEmails);
            usedEmails.Add(email);

            var customer = new CreateCustomerDto
            {
                Name = name,
                Email = email,
                Phone = GeneratePhoneNumber(),
                Address = GenerateAddress()
            };

            customers.Add(customer);
        }

        return customers;
    }

    private string GenerateUniqueEmail(string firstName, string lastName, int index, HashSet<string> usedEmails)
    {
        var domain = _emailDomains[_random.Next(_emailDomains.Length)];
        var baseEmail = $"{firstName.ToLower()}.{lastName.ToLower()}@{domain}";

        // If email already exists, append index
        if (usedEmails.Contains(baseEmail))
        {
            return $"{firstName.ToLower()}.{lastName.ToLower()}{index}@{domain}";
        }

        return baseEmail;
    }

    private string GeneratePhoneNumber()
    {
        // Generate phone number in format: +1-XXX-XXX-XXXX
        var areaCode = _random.Next(200, 999);
        var prefix = _random.Next(200, 999);
        var lineNumber = _random.Next(1000, 9999);

        return $"+1-{areaCode}-{prefix}-{lineNumber}";
    }

    private string GenerateAddress()
    {
        var streetNumber = _random.Next(1, 9999);
        var street = _streets[_random.Next(_streets.Length)];
        var city = _cities[_random.Next(_cities.Length)];
        var state = _states[_random.Next(_states.Length)];
        var postalCode = _random.Next(10000, 99999);
        var country = _countries[_random.Next(_countries.Length)];

        return $"{streetNumber} {street}, {city}, {state} {postalCode}, {country}";
    }
}
