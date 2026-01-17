namespace CustomerApi.DTOs;

/// <summary>
/// Represents an error that occurred during bulk customer creation
/// </summary>
public class BulkCreateError
{
    /// <summary>
    /// Index of the customer that failed to be created
    /// </summary>
    public int Index { get; set; }

    /// <summary>
    /// Error message describing what went wrong
    /// </summary>
    public string Message { get; set; } = string.Empty;
}
