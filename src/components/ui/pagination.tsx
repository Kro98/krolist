import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { ButtonProps, buttonVariants } from "@/components/ui/button";

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
);
Pagination.displayName = "Pagination";

const PaginationContent = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn("flex flex-row items-center gap-1", className)} {...props} />
  ),
);
PaginationContent.displayName = "PaginationContent";

const PaginationItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
));
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">;

const PaginationLink = ({ className, isActive, size = "icon", ...props }: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size,
      }),
      isActive && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
      className,
    )}
    {...props}
  />
);
PaginationLink.displayName = "PaginationLink";

const PaginationPrevious = ({ className, ...props }: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink 
    aria-label="Go to previous page" 
    size="default" 
    className={cn("gap-1 px-2.5 sm:pl-2.5", className)} 
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span className="hidden sm:inline">Previous</span>
  </PaginationLink>
);
PaginationPrevious.displayName = "PaginationPrevious";

const PaginationNext = ({ className, ...props }: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink 
    aria-label="Go to next page" 
    size="default" 
    className={cn("gap-1 px-2.5 sm:pr-2.5", className)} 
    {...props}
  >
    <span className="hidden sm:inline">Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
);
PaginationNext.displayName = "PaginationNext";

const PaginationEllipsis = ({ className, ...props }: React.ComponentProps<"span">) => (
  <span aria-hidden className={cn("flex h-9 w-9 items-center justify-center hidden sm:flex", className)} {...props}>
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
);
PaginationEllipsis.displayName = "PaginationEllipsis";

// Mobile-friendly pagination component
interface MobilePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const MobilePagination = ({ currentPage, totalPages, onPageChange, className }: MobilePaginationProps) => {
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <Pagination className={className}>
      <PaginationContent className="w-full justify-between sm:justify-center">
        {/* Previous button */}
        <PaginationItem>
          <PaginationPrevious
            onClick={() => hasPrevious && onPageChange(currentPage - 1)}
            className={cn(
              "cursor-pointer",
              !hasPrevious && "pointer-events-none opacity-50"
            )}
          />
        </PaginationItem>

        {/* Mobile: Simple page indicator */}
        <PaginationItem className="sm:hidden">
          <span className="flex items-center gap-1 text-sm font-medium px-3 py-2 bg-muted rounded-md">
            {currentPage} / {totalPages}
          </span>
        </PaginationItem>

        {/* Desktop: Full page numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {/* First page */}
          {currentPage > 2 && (
            <>
              <PaginationItem>
                <PaginationLink
                  onClick={() => onPageChange(1)}
                  className="cursor-pointer"
                >
                  1
                </PaginationLink>
              </PaginationItem>
              {currentPage > 3 && <PaginationEllipsis />}
            </>
          )}

          {/* Pages around current */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(page => page >= currentPage - 1 && page <= currentPage + 1)
            .map(page => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => onPageChange(page)}
                  isActive={page === currentPage}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}

          {/* Last page */}
          {currentPage < totalPages - 1 && (
            <>
              {currentPage < totalPages - 2 && <PaginationEllipsis />}
              <PaginationItem>
                <PaginationLink
                  onClick={() => onPageChange(totalPages)}
                  className="cursor-pointer"
                >
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}
        </div>

        {/* Next button */}
        <PaginationItem>
          <PaginationNext
            onClick={() => hasNext && onPageChange(currentPage + 1)}
            className={cn(
              "cursor-pointer",
              !hasNext && "pointer-events-none opacity-50"
            )}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};
MobilePagination.displayName = "MobilePagination";

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  MobilePagination,
};
