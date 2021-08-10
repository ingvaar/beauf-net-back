import { AutoMap } from '@automapper/classes';

export class UserPublicDto {
	@AutoMap()
	id?: string;

	@AutoMap()
	username?: string;

	@AutoMap()
	email?: string;
}
