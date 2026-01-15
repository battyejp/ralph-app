namespace CustomerApi.DTOs;

/// <summary>
/// Generic data transfer object for paginated responses
/// </summary>
/// <typeparam name="T">The type of items in the paginated result</typeparam>
public class PaginatedResponseDto<T>
{
    /// <summary>
    /// Collection of items for the current page
    /// </summary>
    public IEnumerable<T> Items { get; set; } = Enumerable.Empty<T>();

    /// <summary>
    /// Total number of items across all pages
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// Current page number
    /// </summary>
    public int Page { get; set; }

    /// <summary>
    /// Number of items per page
    /// </summary>
    public int PageSize { get; set; }

    /// <summary>
    /// Total number of pages
    /// </summary>
    public int TotalPages { get; set; }
}
