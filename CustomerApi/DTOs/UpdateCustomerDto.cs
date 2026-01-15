using System.ComponentModel.DataAnnotations;

namespace CustomerApi.DTOs;

/// <summary>
/// Data transfer object for updating an existing customer
/// </summary>
public class UpdateCustomerDto
{
    /// <summary>
    /// Customer's full name (required, max 100 characters)
    /// </summary>
    [Required(ErrorMessage = "Name is required")]
    [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Customer's email address (required, must be valid email format)
    /// </summary>
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Customer's phone number (optional, max 20 characters)
    /// </summary>
    [StringLength(20, ErrorMessage = "Phone cannot exceed 20 characters")]
    [Phone(ErrorMessage = "Invalid phone format")]
    public string? Phone { get; set; }

    /// <summary>
    /// Customer's address (optional, max 500 characters)
    /// </summary>
    [StringLength(500, ErrorMessage = "Address cannot exceed 500 characters")]
    public string? Address { get; set; }
}
