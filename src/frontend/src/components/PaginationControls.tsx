"use client"

import React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  totalCount: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  disabled?: boolean
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  disabled = false,
}: PaginationControlsProps) {
  const pageSizes = [10, 25, 50, 100]

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  const handlePageSizeChange = (value: string) => {
    const newPageSize = parseInt(value, 10)
    onPageSizeChange(newPageSize)
  }

  // Calculate the range of items being displayed
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalCount)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      {/* Page info and size selector */}
      <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground">
        <div>
          Showing {startItem} to {endItem} of {totalCount} results
        </div>
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={handlePageSizeChange}
            disabled={disabled}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizes.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center gap-2">
        <div className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={disabled || currentPage === 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={disabled || currentPage >= totalPages}
            aria-label="Next page"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
