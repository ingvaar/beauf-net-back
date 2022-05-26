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
	id?: string;

	@Column({
		nullable: false
	})
	text?: string;

	@Column({
		nullable: true
	})
	source?: string;

	// eslint-disable-next-line @typescript-eslint/no-inferrable-types
	@Column({
		nullable: false
	})
	validated: boolean = false;

	@Column({
		nullable: true
	})
	author?: string;

	@CreateDateColumn({
		name: 'created_at',
		type: 'timestamp',
		nullable: true,
	})
	createdAt?: string;

	@UpdateDateColumn({
		name: 'updated_at',
		type: 'timestamp',
		nullable: true,
	})
	updatedAt?: string;
}