import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LEAD_SOURCES, LeadSource } from '../lead-source.enum';

@Entity({ name: 'leads' })
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  nombre!: string;

  // Unique email — enforced by the DB to make sure no two leads share one.
  @Index({ unique: true, where: '"deleted_at" IS NULL' })
  @Column({ type: 'varchar', length: 180 })
  email!: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  telefono!: string | null;

  @Column({ type: 'enum', enum: LEAD_SOURCES })
  fuente!: LeadSource;

  @Column({ name: 'producto_interes', type: 'varchar', length: 180, nullable: true })
  productoInteres!: string | null;

  // Stored as numeric to avoid floating point drift on currency values.
  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true, transformer: {
    to: (v?: number | null) => v,
    from: (v: string | null) => (v === null ? null : Number(v)),
  } })
  presupuesto!: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Soft delete — TypeORM will populate this column on `softRemove` and
  // automatically exclude the row from default queries.
  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt!: Date | null;
}
