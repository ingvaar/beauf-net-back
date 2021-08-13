import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'quotes' })
export class QuoteEntity {
	@PrimaryGeneratedColumn('uuid')
	@ApiProperty({
		type: 'ObjectId',
	})
	@AutoMap()
	id?: string;

	@Column({
		nullable: false
	})
	@AutoMap()
	text?: string;

	@Column()
	@AutoMap()
	source?: string;

	@Column({
		nullable: false
	})
	@AutoMap()
	validated: boolean = false;

	@Column()
	@AutoMap()
	author?: string;

	@CreateDateColumn({
		name: 'created_at',
		type: 'timestamp',
		nullable: true,
	})
	@AutoMap()
	createdAt?: string;

	@UpdateDateColumn({
		name: 'updated_at',
		type: 'timestamp',
		nullable: true,
	})
	@AutoMap()
	updatedAt?: string;
}