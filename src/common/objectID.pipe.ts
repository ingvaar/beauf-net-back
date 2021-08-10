import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseObjectIDPipe implements PipeTransform<string> {
	transform(value: string): string {
		if (value.length != 36) {
			throw new BadRequestException(`Incorrect length for ID (expected 36 but got ${value.length})`);
		}
		return value;
	}
}
