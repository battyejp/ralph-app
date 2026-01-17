namespace CustomerApi.DTOs;

/// <summary>
/// Response DTO for bulk customer creation operation
/// </summary>
public class BulkCreateResponseDto
{
    /// <summary>
    /// Number of customers successfully created
    /// </summary>
    public int SuccessCount { get; set; }

    /// <summary>
    /// Number of customers that failed to be created
    /// </summary>
    public int FailureCount { get; set; }

    /// <summary>
    /// List of successfully created customers
    /// </summary>
    public List<CustomerResponseDto> CreatedCustomers { get; set; } = new();

    /// <summary>
    /// List of errors that occurred during creation
    /// </summary>
    public List<BulkCreateError> Errors { get; set; } = new();
}
