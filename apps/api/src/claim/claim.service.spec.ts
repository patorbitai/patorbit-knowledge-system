import { Test, type TestingModule } from '@nestjs/testing';
import { ClaimService } from './claim.service';
import { PrismaService } from '@patorbit/database';
import { NotFoundException } from '@nestjs/common';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockClaim = {
  create: jest.fn(),
  findMany: jest.fn(),
  findFirst: jest.fn(),
  update: jest.fn(),
};

const mockTag = {
  upsert: jest.fn(),
  findUnique: jest.fn(),
};

const mockPrismaService = {
  claim: mockClaim,
  tag: mockTag,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const aClaim = (overrides: Record<string, unknown> = {}) => ({
  id: 'claim-id',
  profileId: 'profile-id',
  title: 'Test Claim',
  summary: null,
  date: new Date('2025-06-01'),
  version: 1,
  deletedAt: null,
  createdAt: new Date('2025-06-01'),
  updatedAt: new Date('2025-06-01'),
  ...overrides,
});

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------
describe('ClaimService', () => {
  let service: ClaimService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClaimService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ClaimService>(ClaimService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // -----------------------------------------------------------------------
  // create
  // -----------------------------------------------------------------------
  describe('create', () => {
    it('creates a claim with the provided profileId and dto', async () => {
      const dto = { title: 'Won hackathon', date: '2025-06-01' };
      const created = aClaim({ title: dto.title });

      mockClaim.create.mockResolvedValue(created);

      const result = await service.create('profile-id', dto);

      expect(mockClaim.create).toHaveBeenCalledWith({
        data: { profileId: 'profile-id', ...dto },
      });
      expect(result).toEqual(created);
    });

    it('passes optional summary when provided', async () => {
      const dto = {
        title: 'Published paper',
        summary: 'Accepted at NeurIPS 2025',
        date: '2025-06-01',
      };
      const created = aClaim(dto);

      mockClaim.create.mockResolvedValue(created);

      const result = await service.create('profile-id', dto);

      expect(mockClaim.create).toHaveBeenCalledWith({
        data: { profileId: 'profile-id', ...dto },
      });
      expect(result.summary).toBe('Accepted at NeurIPS 2025');
    });
  });

  // -----------------------------------------------------------------------
  // findAll
  // -----------------------------------------------------------------------
  describe('findAll', () => {
    it('returns non-deleted claims ordered by createdAt desc', async () => {
      const claims = [
        aClaim({ id: 'c-1', createdAt: new Date('2025-06-02') }),
        aClaim({ id: 'c-2', createdAt: new Date('2025-06-01') }),
      ];

      mockClaim.findMany.mockResolvedValue(claims);

      const result = await service.findAll('profile-id');

      expect(mockClaim.findMany).toHaveBeenCalledWith({
        where: { profileId: 'profile-id', deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(claims);
    });

    it('returns an empty array when no claims exist', async () => {
      mockClaim.findMany.mockResolvedValue([]);

      const result = await service.findAll('profile-id');

      expect(result).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // findById
  // -----------------------------------------------------------------------
  describe('findById', () => {
    it('returns a claim with evidences and tags included', async () => {
      const claim = aClaim({
        evidences: [{ id: 'ev-1' }],
        tags: [{ id: 'tg-1', name: 'tech' }],
      });

      mockClaim.findFirst.mockResolvedValue(claim);

      const result = await service.findById('claim-id');

      expect(mockClaim.findFirst).toHaveBeenCalledWith({
        where: { id: 'claim-id', deletedAt: null },
        include: { evidences: true, tags: true },
      });
      expect(result).toEqual(claim);
    });

    it('returns null when claim is not found', async () => {
      mockClaim.findFirst.mockResolvedValue(null);

      const result = await service.findById('unknown-id');

      expect(result).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // update
  // -----------------------------------------------------------------------
  describe('update', () => {
    it('updates claim fields and increments version', async () => {
      const existing = aClaim({ version: 2 });
      const updated = { ...existing, title: 'New Title', version: 3 };
      const dto = { title: 'New Title' };

      mockClaim.findFirst.mockResolvedValue(existing);
      mockClaim.update.mockResolvedValue(updated);

      const result = await service.update('claim-id', dto);

      expect(mockClaim.findFirst).toHaveBeenCalledWith({
        where: { id: 'claim-id', deletedAt: null },
        include: { evidences: true, tags: true },
      });
      expect(mockClaim.update).toHaveBeenCalledWith({
        where: { id: 'claim-id' },
        data: { ...dto, version: { increment: 1 } },
      });
      expect(result).toEqual(updated);
    });

    it('throws NotFoundException when claim does not exist', async () => {
      mockClaim.findFirst.mockResolvedValue(null);

      await expect(
        service.update('unknown-id', { title: 'Nope' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // -----------------------------------------------------------------------
  // softDelete
  // -----------------------------------------------------------------------
  describe('softDelete', () => {
    it('sets deletedAt on the claim', async () => {
      const existing = aClaim();
      const deleted = { ...existing, deletedAt: new Date() };

      mockClaim.findFirst.mockResolvedValue(existing);
      mockClaim.update.mockResolvedValue(deleted);

      const result = await service.softDelete('claim-id');

      expect(mockClaim.findFirst).toHaveBeenCalledWith({
        where: { id: 'claim-id', deletedAt: null },
        include: { evidences: true, tags: true },
      });
      expect(mockClaim.update).toHaveBeenCalledWith({
        where: { id: 'claim-id' },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result).toEqual(deleted);
    });

    it('throws NotFoundException when claim does not exist', async () => {
      mockClaim.findFirst.mockResolvedValue(null);

      await expect(
        service.softDelete('unknown-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // -----------------------------------------------------------------------
  // addTag
  // -----------------------------------------------------------------------
  describe('addTag', () => {
    it('upserts the tag and connects it to the claim', async () => {
      const tag = { id: 'tg-1', name: 'tech' };
      const updatedClaim = aClaim({ tags: [tag] });

      mockTag.upsert.mockResolvedValue(tag);
      mockClaim.update.mockResolvedValue(updatedClaim);

      const result = await service.addTag('claim-id', 'tech');

      expect(mockTag.upsert).toHaveBeenCalledWith({
        where: { name: 'tech' },
        update: {},
        create: { name: 'tech' },
      });
      expect(mockClaim.update).toHaveBeenCalledWith({
        where: { id: 'claim-id' },
        data: { tags: { connect: { id: 'tg-1' } } },
      });
      expect(result).toEqual(updatedClaim);
    });
  });

  // -----------------------------------------------------------------------
  // removeTag
  // -----------------------------------------------------------------------
  describe('removeTag', () => {
    it('disconnects the tag from the claim', async () => {
      const tag = { id: 'tg-1', name: 'tech' };
      const updatedClaim = aClaim({ tags: [] });

      mockTag.findUnique.mockResolvedValue(tag);
      mockClaim.update.mockResolvedValue(updatedClaim);

      const result = await service.removeTag('claim-id', 'tech');

      expect(mockTag.findUnique).toHaveBeenCalledWith({
        where: { name: 'tech' },
      });
      expect(mockClaim.update).toHaveBeenCalledWith({
        where: { id: 'claim-id' },
        data: { tags: { disconnect: { id: 'tg-1' } } },
      });
      expect(result).toEqual(updatedClaim);
    });

    it('throws NotFoundException when the tag does not exist', async () => {
      mockTag.findUnique.mockResolvedValue(null);

      await expect(
        service.removeTag('claim-id', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
