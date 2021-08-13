/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Mapper, MappingProfile } from '@automapper/types';
import { Injectable } from '@nestjs/common';
import { UserPublicDto } from '../user/dto/user.public.dto';
import { UserEntity } from '../user/user.entity';

@Injectable()
export class UserProfile extends AutomapperProfile {
	constructor(@InjectMapper() mapper: Mapper) {
		super(mapper);
	}

	mapProfile(): MappingProfile {
		return (mapper): void => {
			mapper.createMap(UserEntity, UserPublicDto);
		}
	}
}