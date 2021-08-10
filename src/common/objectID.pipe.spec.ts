import { BadRequestException } from '@nestjs/common';

import { ParseObjectIDPipe } from './objectID.pipe';

describe('Common: ObjectID pipe', function () {
	it('Correct ID', function () {
		const pipe = new ParseObjectIDPipe();
		const id = '73bacbe4-b277-11eb-8529-0242ac130003';
		expect(pipe.transform(id)).toBe(id);
	});

	it('Incorrect ID', function () {
		const pipe = new ParseObjectIDPipe();
		const id = 'My incorrect ID';

		try {
			pipe.transform(id);
		} catch (error) {
			expect(error).toBeInstanceOf(BadRequestException);
		}
	});
});
