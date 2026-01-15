namespace CustomerApi.DTOs;

/// <summary>
/// Data transfer object for customer response
/// </summary>
public class CustomerResponseDto
{
    /// <summary>
    /// Unique identifier for the customer
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Customer's full name
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Customer's email address
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Customer's phone number
    /// </summary>
    public string? Phone { get; set; }

    /// <summary>
    /// Customer's address
    /// </summary>
    public string? Address { get; set; }

    /// <summary>
    /// Timestamp when the customer was created (UTC)
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Timestamp when the customer was last updated (UTC)
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}
