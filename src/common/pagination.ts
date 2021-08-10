export class Pagination {
	public static check(page: number, perPage: number): { page: number; perPage: number } {
		if (!page || page < 1 || isNaN(page)) {
			page = 1;
		}

		if (!perPage || perPage > 50 || perPage < 1 || isNaN(perPage)) {
			perPage = 50;
		}

		if (typeof page == 'string') {
			page = parseInt(page);
		}
		if (typeof perPage == 'string') {
			perPage = parseInt(perPage);
		}

		return { page, perPage };
	}
}
