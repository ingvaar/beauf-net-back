import { Pagination } from './pagination';

describe('Common: Pagination checker', function () {
	it('Correct values', function () {
		const page = 1;
		const perPage = 25;

		const expectedResult = {
			page: 1,
			perPage: 25,
		};

		expect(Pagination.check(page, perPage)).toStrictEqual(expectedResult);
	});

	it('Page < 1', function () {
		const page = 0;
		const perPage = 25;

		const expectedResult = {
			page: 1,
			perPage: 25,
		};

		expect(Pagination.check(page, perPage)).toStrictEqual(expectedResult);
	});

	it('perPage < 1', function () {
		const page = 1;
		const perPage = 0;

		const expectedResult = {
			page: 1,
			perPage: 50,
		};

		expect(Pagination.check(page, perPage)).toStrictEqual(expectedResult);
	});

	it('perPage > 50', function () {
		const page = 1;
		const perPage = 51;

		const expectedResult = {
			page: 1,
			perPage: 50,
		};

		expect(Pagination.check(page, perPage)).toStrictEqual(expectedResult);
	});
});
