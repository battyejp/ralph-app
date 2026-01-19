using System.ComponentModel.DataAnnotations;

namespace CustomerApi.DTOs;

/// <summary>
/// Request DTO for bulk creating random customers
/// </summary>
public class BulkCreateRequestDto
{
    /// <summary>
    /// Number of random customers to create (1-1000)
    /// </summary>
    [Required(ErrorMessage = "Count is required")]
    [Range(1, 1000, ErrorMessage = "Count must be between 1 and 1000")]
    public int Count { get; set; }
}
