import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Mapper, MappingProfile } from '@automapper/types';
import { Injectable } from '@nestjs/common';
import { QuotePrivateDto } from './dto/quote.private.dto';
import { QuotePublicDto } from './dto/quote.public.dto';
import { QuoteEntity } from './quote.entity';

@Injectable()
export class QuoteProfile extends AutomapperProfile {
	constructor(@InjectMapper() mapper: Mapper) {
		super(mapper);
	}

	mapProfile(): MappingProfile {
		return (mapper): void => {
			mapper.createMap(QuoteEntity, QuotePublicDto);
			mapper.createMap(QuoteEntity, QuotePrivateDto);
		}
	}
}