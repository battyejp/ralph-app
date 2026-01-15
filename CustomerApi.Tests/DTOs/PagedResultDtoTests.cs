using CustomerApi.DTOs;
using FluentAssertions;

namespace CustomerApi.Tests.DTOs;

public class PagedResultDtoTests
{
    [Fact]
    public void PagedResultDto_NewInstance_HasDefaultValues()
    {
        var dto = new PagedResultDto<string>();

        dto.Items.Should().BeEmpty();
        dto.TotalCount.Should().Be(0);
        dto.Page.Should().Be(0);
        dto.PageSize.Should().Be(0);
    }

    [Fact]
    public void PagedResultDto_SetProperties_PropertiesAreSet()
    {
        var items = new List<string> { "item1", "item2" };

        var dto = new PagedResultDto<string>
        {
            Items = items,
            TotalCount = 50,
            Page = 2,
            PageSize = 10
        };

        dto.Items.Should().BeEquivalentTo(items);
        dto.TotalCount.Should().Be(50);
        dto.Page.Should().Be(2);
        dto.PageSize.Should().Be(10);
    }

    [Fact]
    public void PagedResultDto_TotalPages_CalculatedCorrectly()
    {
        var dto = new PagedResultDto<string>
        {
            TotalCount = 25,
            PageSize = 10
        };

        dto.TotalPages.Should().Be(3); // Ceiling of 25/10 = 3
    }

    [Fact]
    public void PagedResultDto_TotalPages_WithExactDivision()
    {
        var dto = new PagedResultDto<string>
        {
            TotalCount = 20,
            PageSize = 10
        };

        dto.TotalPages.Should().Be(2);
    }

    [Fact]
    public void PagedResultDto_HasNextPage_TrueWhenNotOnLastPage()
    {
        var dto = new PagedResultDto<string>
        {
            TotalCount = 30,
            Page = 2,
            PageSize = 10
        };

        dto.HasNextPage.Should().BeTrue();
    }

    [Fact]
    public void PagedResultDto_HasNextPage_FalseWhenOnLastPage()
    {
        var dto = new PagedResultDto<string>
        {
            TotalCount = 30,
            Page = 3,
            PageSize = 10
        };

        dto.HasNextPage.Should().BeFalse();
    }

    [Fact]
    public void PagedResultDto_HasPreviousPage_TrueWhenNotOnFirstPage()
    {
        var dto = new PagedResultDto<string>
        {
            TotalCount = 30,
            Page = 2,
            PageSize = 10
        };

        dto.HasPreviousPage.Should().BeTrue();
    }

    [Fact]
    public void PagedResultDto_HasPreviousPage_FalseWhenOnFirstPage()
    {
        var dto = new PagedResultDto<string>
        {
            TotalCount = 30,
            Page = 1,
            PageSize = 10
        };

        dto.HasPreviousPage.Should().BeFalse();
    }

    [Fact]
    public void PagedResultDto_WithGenericType_WorksWithCustomerResponseDto()
    {
        var customer = new CustomerResponseDto
        {
            Id = Guid.NewGuid(),
            Name = "Test",
            Email = "test@example.com"
        };

        var dto = new PagedResultDto<CustomerResponseDto>
        {
            Items = new[] { customer },
            TotalCount = 1,
            Page = 1,
            PageSize = 10
        };

        dto.Items.Should().ContainSingle();
        dto.TotalPages.Should().Be(1);
    }
}
