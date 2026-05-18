import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Lead } from './entities/lead.entity';
import { LeadsService } from './leads.service';

/**
 * Pure unit tests for the service. The repository is mocked so the tests
 * don't need a real database — they focus on the business rules (uniqueness,
 * not-found, soft delete, stats aggregation).
 */
describe('LeadsService', () => {
  let service: LeadsService;
  let repo: jest.Mocked<Repository<Lead>>;

  const repoMock = (): any => ({
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    find: jest.fn(),
    create: jest.fn((dto: Partial<Lead>) => dto as Lead),
    save: jest.fn((entity: Partial<Lead>) => Promise.resolve(entity as Lead)),
    softRemove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
      getRawOne: jest.fn().mockResolvedValue({ avg: null }),
    }),
  });

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        LeadsService,
        { provide: getRepositoryToken(Lead), useValue: repoMock() },
      ],
    }).compile();
    service = module.get(LeadsService);
    repo = module.get(getRepositoryToken(Lead));
  });

  it('creates a lead when the email is new', async () => {
    repo.findOne.mockResolvedValue(null);
    const lead = await service.create({
      nombre: 'Test',
      email: 'new@example.com',
      fuente: 'instagram',
    });
    expect(lead.email).toBe('new@example.com');
    expect(repo.save).toHaveBeenCalled();
  });

  it('rejects duplicate email with 409', async () => {
    repo.findOne.mockResolvedValue({ id: 'x' } as Lead);
    await expect(
      service.create({
        nombre: 'Test',
        email: 'dup@example.com',
        fuente: 'instagram',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws 404 when the lead does not exist', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('soft-removes a lead', async () => {
    const lead = { id: 'abc' } as Lead;
    repo.findOne.mockResolvedValue(lead);
    const result = await service.remove('abc');
    expect(repo.softRemove).toHaveBeenCalledWith(lead);
    expect(result).toEqual({ deleted: true, id: 'abc' });
  });

  it('returns stats with zero counts when there are no leads', async () => {
    repo.count.mockResolvedValue(0);
    const stats = await service.stats();
    expect(stats.total).toBe(0);
    expect(stats.bySource.instagram).toBe(0);
    expect(stats.averageBudget).toBeNull();
  });
});
