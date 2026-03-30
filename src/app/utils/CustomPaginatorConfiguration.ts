import { MatPaginatorIntl } from '@angular/material/paginator';

export function CustomPaginator() {
    const customPaginatorIntl = new MatPaginatorIntl();

    customPaginatorIntl.itemsPerPageLabel = $localize`Items per page:`;
    customPaginatorIntl.firstPageLabel = $localize`First page`;
    customPaginatorIntl.lastPageLabel = $localize`Last page`;
    customPaginatorIntl.nextPageLabel = $localize`Next page`;
    customPaginatorIntl.previousPageLabel = $localize`Previous page`;
    customPaginatorIntl.getRangeLabel = (
        page: number,
        pageSize: number,
        length: number
    ) => {
        if (length === 0 || pageSize === 0) {
            return $localize`0 of ${length}`;
        }
        length = Math.max(length, 0);
        const startIndex = page * pageSize;
        const endIndex =
            startIndex < length
                ? Math.min(startIndex + pageSize, length)
                : startIndex + pageSize;
        return $localize`${startIndex + 1} - ${endIndex} of ${length}`;
    };

    return customPaginatorIntl;
}
