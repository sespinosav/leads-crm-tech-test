import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { CreateLeadDto } from './dto/create-lead.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { Lead } from './entities/lead.entity';
import { LeadSource } from './lead-source.enum';

export interface PaginatedLeads {
  data: Lead[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface LeadStats {
  total: number;
  bySource: Record<LeadSource, number>;
  averageBudget: number | null;
  lastSevenDays: number;
}

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead) private readonly leads: Repository<Lead>,
  ) {}

  async create(dto: CreateLeadDto): Promise<Lead> {
    // Duplicate-email guard. We check explicitly to return a clean 409 rather
    // than relying on the DB unique-violation error code.
    const existing = await this.leads.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException(`A lead with email "${dto.email}" already exists`);
    }
    const lead = this.leads.create({
      nombre: dto.nombre,
      email: dto.email,
      telefono: dto.telefono ?? null,
      fuente: dto.fuente,
      productoInteres: dto.productoInteres ?? null,
      presupuesto: dto.presupuesto ?? null,
    });
    return this.leads.save(lead);
  }

  async findAll(query: QueryLeadsDto): Promise<PaginatedLeads> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Record<string, unknown> = {};
    if (query.fuente) where.fuente = query.fuente;
    if (query.from && query.to) {
      where.createdAt = Between(new Date(query.from), new Date(query.to));
    } else if (query.from) {
      where.createdAt = MoreThanOrEqual(new Date(query.from));
    } else if (query.to) {
      where.createdAt = LessThanOrEqual(new Date(query.to));
    }

    const [data, total] = await this.leads.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findOne(id: string): Promise<Lead> {
    const lead = await this.leads.findOne({ where: { id } });
    if (!lead) throw new NotFoundException(`Lead ${id} not found`);
    return lead;
  }

  async update(id: string, dto: UpdateLeadDto): Promise<Lead> {
    const lead = await this.findOne(id);

    // If the email changes, re-check uniqueness.
    if (dto.email && dto.email !== lead.email) {
      const collision = await this.leads.findOne({ where: { email: dto.email } });
      if (collision) {
        throw new ConflictException(`A lead with email "${dto.email}" already exists`);
      }
    }

    Object.assign(lead, {
      ...(dto.nombre !== undefined && { nombre: dto.nombre }),
      ...(dto.email !== undefined && { email: dto.email }),
      ...(dto.telefono !== undefined && { telefono: dto.telefono }),
      ...(dto.fuente !== undefined && { fuente: dto.fuente }),
      ...(dto.productoInteres !== undefined && { productoInteres: dto.productoInteres }),
      ...(dto.presupuesto !== undefined && { presupuesto: dto.presupuesto }),
    });
    return this.leads.save(lead);
  }

  async remove(id: string): Promise<{ deleted: true; id: string }> {
    const lead = await this.findOne(id);
    await this.leads.softRemove(lead);
    return { deleted: true, id };
  }

  async stats(): Promise<LeadStats> {
    // Total + per-source counts via a single grouped query.
    const totalRow = await this.leads.count();

    const grouped = await this.leads
      .createQueryBuilder('l')
      .select('l.fuente', 'fuente')
      .addSelect('COUNT(*)', 'count')
      .groupBy('l.fuente')
      .getRawMany<{ fuente: LeadSource; count: string }>();

    const bySource: Record<LeadSource, number> = {
      instagram: 0,
      facebook: 0,
      landing_page: 0,
      referido: 0,
      otro: 0,
    };
    for (const row of grouped) bySource[row.fuente] = Number(row.count);

    const avgRow = await this.leads
      .createQueryBuilder('l')
      .select('AVG(l.presupuesto)', 'avg')
      .where('l.presupuesto IS NOT NULL')
      .getRawOne<{ avg: string | null }>();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const lastSevenDays = await this.leads.count({
      where: { createdAt: MoreThanOrEqual(sevenDaysAgo) },
    });

    return {
      total: totalRow,
      bySource,
      averageBudget:
        avgRow?.avg !== null && avgRow?.avg !== undefined
          ? Number(Number(avgRow.avg).toFixed(2))
          : null,
      lastSevenDays,
    };
  }

  /** Used by the AI module — same filters as `findAll` but returns every match (no pagination). */
  async findForReport(filter: {
    fuente?: LeadSource;
    from?: string;
    to?: string;
  }): Promise<Lead[]> {
    const where: Record<string, unknown> = {};
    if (filter.fuente) where.fuente = filter.fuente;
    if (filter.from && filter.to) {
      where.createdAt = Between(new Date(filter.from), new Date(filter.to));
    } else if (filter.from) {
      where.createdAt = MoreThanOrEqual(new Date(filter.from));
    } else if (filter.to) {
      where.createdAt = LessThanOrEqual(new Date(filter.to));
    }
    return this.leads.find({ where, order: { createdAt: 'DESC' } });
  }
}
