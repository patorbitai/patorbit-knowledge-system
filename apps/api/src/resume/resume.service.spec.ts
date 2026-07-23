import { Test, type TestingModule } from '@nestjs/testing';
import { ResumeService } from './resume.service';
import { PrismaService } from '@patorbit/database';
import { ProfileService } from '../profile/profile.service';
import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@patorbit/database';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockResumeVersion = {
  findMany: jest.fn(),
  findFirst: jest.fn(),
  findUnique: jest.fn(),
  create: jest.fn(),
};

const mockResumeSection = {
  deleteMany: jest.fn(),
};

const mockResume = {
  create: jest.fn(),
  findMany: jest.fn(),
  count: jest.fn(),
  findFirst: jest.fn(),
  update: jest.fn(),
};

const mockPrismaService = {
  resume: mockResume,
  resumeSection: mockResumeSection,
  resumeVersion: mockResumeVersion,
  $transaction: jest.fn(),
};

const mockProfileService = {
  findByUserId: jest.fn(),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const aProfile = (overrides = {}) => ({
  id: 'profile-id',
  userId: 'user-id',
  ...overrides,
});

const aResume = (overrides = {}) => ({
  id: 'resume-id',
  profileId: 'profile-id',
  title: 'Test Resume',
  status: 'DRAFT',
  templateId: null,
  theme: null,
  metadata: null,
  version: 1,
  deletedAt: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  sections: [],
  ...overrides,
});

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------
describe('ResumeService', () => {
  let service: ResumeService;
  let prisma: typeof mockPrismaService;
  let profileService: typeof mockProfileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResumeService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ProfileService, useValue: mockProfileService },
      ],
    }).compile();

    service = module.get<ResumeService>(ResumeService);
    prisma = module.get(PrismaService);
    profileService = module.get(ProfileService);
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
    it('creates a resume linked to the user profile', async () => {
      const dto = { title: 'My Resume' };
      const profile = aProfile();
      const created = aResume({ ...dto });

      profileService.findByUserId.mockResolvedValue(profile);
      mockResume.create.mockResolvedValue(created);

      const result = await service.create(dto, 'user-id');

      expect(profileService.findByUserId).toHaveBeenCalledWith('user-id');
      expect(mockResume.create).toHaveBeenCalledWith({
        data: { ...dto, profileId: profile.id },
        include: { sections: { orderBy: { sortOrder: 'asc' } } },
      });
      expect(result).toEqual(created);
    });

    it('passes templateId when provided', async () => {
      const dto = { title: 'Templated', templateId: 'tmpl-1' };
      const profile = aProfile();

      profileService.findByUserId.mockResolvedValue(profile);
      mockResume.create.mockResolvedValue(aResume());

      await service.create(dto, 'user-id');

      expect(mockResume.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ templateId: 'tmpl-1' }),
        }),
      );
    });

    it('does not include templateId when omitted', async () => {
      const dto = { title: 'No Template' };
      const profile = aProfile();

      profileService.findByUserId.mockResolvedValue(profile);
      mockResume.create.mockResolvedValue(aResume());

      await service.create(dto, 'user-id');

      // The data passed should NOT have a templateId key at all
      const callData = mockResume.create.mock.calls[0][0].data;
      expect(callData).not.toHaveProperty('templateId');
    });
  });

  // -----------------------------------------------------------------------
  // findAll
  // -----------------------------------------------------------------------
  describe('findAll', () => {
    it('returns a paginated result (default page/limit)', async () => {
      const profile = aProfile();
      const resumes = [aResume({ id: 'r-1' }), aResume({ id: 'r-2' })];
      const total = 2;

      profileService.findByUserId.mockResolvedValue(profile);
      mockResume.count.mockResolvedValue(total);
      mockResume.findMany.mockResolvedValue(resumes);

      const result = await service.findAll({}, 'user-id');

      expect(mockResume.count).toHaveBeenCalledWith({
        where: { profileId: profile.id, deletedAt: null },
      });
      expect(mockResume.findMany).toHaveBeenCalledWith({
        where: { profileId: profile.id, deletedAt: null },
        skip: 0,
        take: 10,
        orderBy: { updatedAt: 'desc' },
      });
      expect(result).toEqual({
        data: resumes,
        meta: { total: 2, page: 1, limit: 10, lastPage: 1 },
      });
    });

    it('applies search filter', async () => {
      const profile = aProfile();
      profileService.findByUserId.mockResolvedValue(profile);
      mockResume.count.mockResolvedValue(0);
      mockResume.findMany.mockResolvedValue([]);

      await service.findAll({ search: 'engineer' }, 'user-id');

      expect(mockResume.count).toHaveBeenCalledWith({
        where: {
          profileId: profile.id,
          deletedAt: null,
          title: { contains: 'engineer', mode: 'insensitive' },
        },
      });
    });

    it('applies status filter', async () => {
      const profile = aProfile();
      profileService.findByUserId.mockResolvedValue(profile);
      mockResume.count.mockResolvedValue(0);
      mockResume.findMany.mockResolvedValue([]);

      await service.findAll({ filter: 'status:ARCHIVED' }, 'user-id');

      expect(mockResume.count).toHaveBeenCalledWith({
        where: {
          profileId: profile.id,
          deletedAt: null,
          status: 'ARCHIVED',
        },
      });
    });

    it('applies custom sort', async () => {
      const profile = aProfile();
      profileService.findByUserId.mockResolvedValue(profile);
      mockResume.count.mockResolvedValue(0);
      mockResume.findMany.mockResolvedValue([]);

      await service.findAll({ sort: 'createdAt:asc' }, 'user-id');

      expect(mockResume.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'asc' } }),
      );
    });
  });

  // -----------------------------------------------------------------------
  // findOne
  // -----------------------------------------------------------------------
  describe('findOne', () => {
    it('returns a resume when owned by the user', async () => {
      const profile = aProfile();
      const resume = aResume();

      profileService.findByUserId.mockResolvedValue(profile);
      mockResume.findFirst.mockResolvedValue(resume);

      const result = await service.findOne('resume-id', 'user-id');

      expect(mockResume.findFirst).toHaveBeenCalledWith({
        where: { id: 'resume-id', deletedAt: null, profileId: profile.id },
        include: { sections: { orderBy: { sortOrder: 'asc' } }, template: true },
      });
      expect(result).toEqual(resume);
    });

    it('throws NotFoundException when resume is missing', async () => {
      profileService.findByUserId.mockResolvedValue(aProfile());
      mockResume.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('unknown-id', 'user-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('works without a userId (admin use)', async () => {
      const resume = aResume();
      mockResume.findFirst.mockResolvedValue(resume);

      const result = await service.findOne('resume-id');

      expect(profileService.findByUserId).not.toHaveBeenCalled();
      expect(mockResume.findFirst).toHaveBeenCalledWith({
        where: { id: 'resume-id', deletedAt: null },
        include: { sections: { orderBy: { sortOrder: 'asc' } }, template: true },
      });
      expect(result).toEqual(resume);
    });
  });

  // -----------------------------------------------------------------------
  // update
  // -----------------------------------------------------------------------
  describe('update', () => {
    it('updates resume fields and increments version', async () => {
      const profile = aProfile();
      const existing = aResume({ version: 3 });
      const updated = { ...existing, title: 'New Title', version: 4 };

      profileService.findByUserId.mockResolvedValue(profile);
      mockResume.findFirst.mockResolvedValue(existing);
      mockResume.update.mockResolvedValue(updated);

      const result = await service.update(
        'resume-id',
        { title: 'New Title' },
        'user-id',
      );

      expect(mockResume.findFirst).toHaveBeenCalledWith({
        where: { id: 'resume-id', deletedAt: null, profileId: profile.id },
        include: { sections: { orderBy: { sortOrder: 'asc' } }, template: true },
      });
      expect(mockResume.update).toHaveBeenCalledWith({
        where: { id: 'resume-id' },
        data: {
          title: 'New Title',
          status: undefined,
          metadata: undefined,
          theme: undefined,
          version: { increment: 1 },
        },
      });
      expect(result).toEqual(updated);
    });

    it('throws ConflictException on version mismatch (optimistic locking)', async () => {
      profileService.findByUserId.mockResolvedValue(aProfile());
      mockResume.findFirst.mockResolvedValue(aResume());
      mockResume.update.mockRejectedValue(
        Object.assign(
          new Prisma.PrismaClientKnownRequestError('Record not found', {
            code: 'P2025',
            clientVersion: '5.0.0',
          }),
        ),
      );

      await expect(
        service.update(
          'resume-id',
          { title: 'T', expectedVersion: 42 },
          'user-id',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('re-throws non-P2025 Prisma errors', async () => {
      profileService.findByUserId.mockResolvedValue(aProfile());
      mockResume.findFirst.mockResolvedValue(aResume());
      const genericError = new Error('DB down');
      mockResume.update.mockRejectedValue(genericError);

      await expect(
        service.update('resume-id', { title: 'T' }, 'user-id'),
      ).rejects.toThrow('DB down');
    });
  });

  // -----------------------------------------------------------------------
  // updateTitle
  // -----------------------------------------------------------------------
  describe('updateTitle', () => {
    it('updates only the title and bumps version', async () => {
      const profile = aProfile();
      const existing = aResume({ version: 2 });
      const updated = { ...existing, title: 'Renamed', version: 3 };

      profileService.findByUserId.mockResolvedValue(profile);
      mockResume.findFirst.mockResolvedValue(existing);
      mockResume.update.mockResolvedValue(updated);

      const result = await service.updateTitle('resume-id', 'Renamed', 'user-id');

      expect(mockResume.update).toHaveBeenCalledWith({
        where: { id: 'resume-id' },
        data: { title: 'Renamed', version: { increment: 1 } },
      });
      expect(result).toEqual(updated);
    });

    it('throws NotFoundException for missing resume', async () => {
      profileService.findByUserId.mockResolvedValue(aProfile());
      mockResume.findFirst.mockResolvedValue(null);

      await expect(
        service.updateTitle('ghost-id', 'Title', 'user-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // -----------------------------------------------------------------------
  // softDelete
  // -----------------------------------------------------------------------
  describe('softDelete', () => {
    it('sets deletedAt to a date', async () => {
      const profile = aProfile();
      const existing = aResume();

      profileService.findByUserId.mockResolvedValue(profile);
      mockResume.findFirst.mockResolvedValue(existing);
      mockResume.update.mockResolvedValue({ ...existing, deletedAt: new Date() });

      await service.softDelete('resume-id', 'user-id');

      expect(mockResume.update).toHaveBeenCalledWith({
        where: { id: 'resume-id' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  // -----------------------------------------------------------------------
  // duplicate
  // -----------------------------------------------------------------------
  describe('duplicate', () => {
    it('copies a resume with a new title', async () => {
      const profile = aProfile();
      const sections = [
        {
          id: 's-1',
          type: 'EXPERIENCE',
          title: 'Job',
          sortOrder: 1,
          isVisible: true,
          isCollapsible: true,
          isCollapsed: false,
          content: {},
          metadata: {},
        },
      ];
      const original = aResume({
        sections,
        templateId: 'tmpl-1',
        theme: { primary: 'blue' },
        metadata: { key: 'val' },
      });

      profileService.findByUserId.mockResolvedValue(profile);
      mockResume.findFirst.mockResolvedValue(original);
      mockResume.create.mockResolvedValue(aResume({ id: 'copy-id' }));

      const result = await service.duplicate(
        'resume-id',
        { title: 'My Copy' },
        'user-id',
      );

      expect(mockResume.create).toHaveBeenCalledWith({
        data: {
          profileId: profile.id,
          title: 'My Copy',
          status: 'DRAFT',
          templateId: 'tmpl-1',
          theme: { primary: 'blue' },
          metadata: { key: 'val' },
          sections: {
            create: sections.map((s) => ({
              type: s.type,
              title: s.title,
              sortOrder: s.sortOrder,
              isVisible: s.isVisible,
              isCollapsible: s.isCollapsible,
              isCollapsed: s.isCollapsed,
              content: s.content,
              metadata: s.metadata,
            })),
          },
        },
        include: { sections: { orderBy: { sortOrder: 'asc' } } },
      });
      expect(result).toBeDefined();
    });

    it('appends "(Copy)" suffix when title is not provided', async () => {
      const profile = aProfile();
      const original = aResume({ title: 'Original', sections: [] });

      profileService.findByUserId.mockResolvedValue(profile);
      mockResume.findFirst.mockResolvedValue(original);
      mockResume.create.mockResolvedValue(aResume({ id: 'copy-id' }));

      await service.duplicate('resume-id', {}, 'user-id');

      const data = mockResume.create.mock.calls[0][0].data;
      expect(data.title).toBe('Original (Copy)');
    });

    it('handles null theme/metadata via Prisma.JsonNull', async () => {
      const profile = aProfile();
      const original = aResume({
        theme: null,
        metadata: null,
        sections: [],
      });

      profileService.findByUserId.mockResolvedValue(profile);
      mockResume.findFirst.mockResolvedValue(original);
      mockResume.create.mockResolvedValue(aResume({ id: 'copy-id' }));

      await service.duplicate('resume-id', { title: 'Copy' }, 'user-id');

      const data = mockResume.create.mock.calls[0][0].data;
      expect(data.theme).toBe(Prisma.JsonNull);
      expect(data.metadata).toBe(Prisma.JsonNull);
    });
  });

  // -----------------------------------------------------------------------
  // archive
  // -----------------------------------------------------------------------
  describe('archive', () => {
    it('sets status to ARCHIVED', async () => {
      const profile = aProfile();
      const existing = aResume();

      profileService.findByUserId.mockResolvedValue(profile);
      mockResume.findFirst.mockResolvedValue(existing);
      mockResume.update.mockResolvedValue({ ...existing, status: 'ARCHIVED' });

      const result = await service.archive('resume-id', 'user-id');

      expect(mockResume.update).toHaveBeenCalledWith({
        where: { id: 'resume-id' },
        data: { status: 'ARCHIVED' },
      });
      expect(result.status).toBe('ARCHIVED');
    });
  });

  // -----------------------------------------------------------------------
  // findRecent
  // -----------------------------------------------------------------------
  describe('findRecent', () => {
    it('returns non-archived resumes ordered by updatedAt desc', async () => {
      const profile = aProfile();
      const recent = [aResume({ id: 'r-1' }), aResume({ id: 'r-2' })];

      profileService.findByUserId.mockResolvedValue(profile);
      mockResume.findMany.mockResolvedValue(recent);

      const result = await service.findRecent('user-id', 3);

      expect(mockResume.findMany).toHaveBeenCalledWith({
        where: {
          profileId: profile.id,
          deletedAt: null,
          status: { not: 'ARCHIVED' },
        },
        orderBy: { updatedAt: 'desc' },
        take: 3,
      });
      expect(result).toEqual(recent);
    });

    it('defaults to 5 items', async () => {
      profileService.findByUserId.mockResolvedValue(aProfile());
      mockResume.findMany.mockResolvedValue([]);

      await service.findRecent('user-id');

      expect(mockResume.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
    });
  });

  // -----------------------------------------------------------------------
  // findDrafts
  // -----------------------------------------------------------------------
  describe('findDrafts', () => {
    it('returns only DRAFT resumes', async () => {
      const profile = aProfile();
      const drafts = [aResume({ id: 'd-1', status: 'DRAFT' })];

      profileService.findByUserId.mockResolvedValue(profile);
      mockResume.findMany.mockResolvedValue(drafts);

      const result = await service.findDrafts('user-id');

      expect(mockResume.findMany).toHaveBeenCalledWith({
        where: { profileId: profile.id, deletedAt: null, status: 'DRAFT' },
        orderBy: { updatedAt: 'desc' },
      });
      expect(result).toEqual(drafts);
    });
  });

  // -----------------------------------------------------------------------
  // Versioning: listVersions
  // -----------------------------------------------------------------------
  describe('listVersions', () => {
    it('lists all versions for a resume', async () => {
      const profile = aProfile();
      const existing = aResume();
      const versions = [
        { id: 'v-1', version: 1, resumeId: 'resume-id' },
        { id: 'v-2', version: 2, resumeId: 'resume-id' },
      ];

      profileService.findByUserId.mockResolvedValue(profile);
      mockResume.findFirst.mockResolvedValue(existing);
      mockResumeVersion.findMany.mockResolvedValue(versions);

      const result = await service.listVersions('resume-id', 'user-id');

      expect(mockResumeVersion.findMany).toHaveBeenCalledWith({
        where: { resumeId: 'resume-id' },
        orderBy: { version: 'desc' },
      });
      expect(result).toEqual(versions);
    });
  });

  // -----------------------------------------------------------------------
  // Versioning: createVersion
  // -----------------------------------------------------------------------
  describe('createVersion', () => {
    it('creates a version snapshot with incremented version number', async () => {
      const profile = aProfile();
      const existing = aResume({
        sections: [
          {
            id: 's-1',
            type: 'EXPERIENCE',
            title: 'Job',
            sortOrder: 1,
            isVisible: true,
            isCollapsible: true,
            isCollapsed: false,
            content: { company: 'Acme' },
            metadata: {},
          },
        ],
      });
      const maxVersion = { version: 5 };
      const createdVersion = {
        id: 'v-6',
        version: 6,
        resumeId: 'resume-id',
        note: 'Snapshot before big edit',
        snapshot: { title: existing.title },
      };

      profileService.findByUserId.mockResolvedValue(profile);
      mockResume.findFirst.mockResolvedValue(existing);
      mockResumeVersion.findFirst.mockResolvedValue(maxVersion);
      mockResumeVersion.create.mockResolvedValue(createdVersion);

      const result = await service.createVersion(
        'resume-id',
        'Snapshot before big edit',
        'user-id',
      );

      expect(mockResumeVersion.create).toHaveBeenCalledWith({
        data: {
          resumeId: 'resume-id',
          version: 6,
          note: 'Snapshot before big edit',
          snapshot: expect.objectContaining({ title: 'Test Resume' }),
        },
      });
      expect(result).toEqual(createdVersion);
    });

    it('starts at version 1 when no prior versions exist', async () => {
      const profile = aProfile();
      const existing = aResume({ sections: [] });

      profileService.findByUserId.mockResolvedValue(profile);
      mockResume.findFirst.mockResolvedValue(existing);
      mockResumeVersion.findFirst.mockResolvedValue(null);
      mockResumeVersion.create.mockResolvedValue({ id: 'v-1', version: 1 });

      const result = await service.createVersion('resume-id', undefined, 'user-id');

      expect(mockResumeVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ version: 1 }),
        }),
      );
      expect(result.version).toBe(1);
    });
  });

  // -----------------------------------------------------------------------
  // Versioning: restoreVersion
  // -----------------------------------------------------------------------
  describe('restoreVersion', () => {
    it('restores a version snapshot via transaction', async () => {
      const profile = aProfile();
      const existing = aResume({ version: 3 });
      const versionRecord = {
        id: 'v-1',
        version: 1,
        resumeId: 'resume-id',
        snapshot: {
          title: 'Old Title',
          status: 'DRAFT',
          templateId: null,
          theme: null,
          metadata: null,
          sections: [
            {
              type: 'EXPERIENCE',
              title: 'Old Job',
              sortOrder: 1,
              isVisible: true,
              isCollapsible: true,
              isCollapsed: false,
              content: { company: 'OldCo' },
              metadata: {},
            },
          ],
        },
      };

      profileService.findByUserId.mockResolvedValue(profile);
      mockResume.findFirst.mockResolvedValue(existing);
      mockResumeVersion.findUnique.mockResolvedValue(versionRecord);
      mockResumeSection.deleteMany.mockResolvedValue({ count: 1 });

      const tx = {
        resumeSection: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
        resume: { update: jest.fn().mockResolvedValue({}) },
      };
      mockPrismaService.$transaction.mockImplementation(
        async (cb: (tx: typeof tx) => Promise<unknown>) => cb(tx),
      );

      // After the transaction, findOne is called again
      mockResume.findFirst.mockResolvedValue(aResume({ title: 'Old Title' }));

      const result = await service.restoreVersion(
        'resume-id',
        'v-1',
        'user-id',
      );

      expect(mockResumeVersion.findUnique).toHaveBeenCalledWith({
        where: { id: 'v-1' },
      });
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(tx.resumeSection.deleteMany).toHaveBeenCalledWith({
        where: { resumeId: 'resume-id' },
      });
      expect(tx.resume.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'resume-id' },
          data: expect.objectContaining({
            title: 'Old Title',
            version: { increment: 1 },
          }),
        }),
      );
      expect(result).toBeDefined();
    });

    it('throws NotFoundException when version does not belong to resume', async () => {
      const profile = aProfile();
      const existing = aResume();
      const versionRecord = {
        id: 'v-1',
        resumeId: 'other-resume-id',
        snapshot: {},
      };

      profileService.findByUserId.mockResolvedValue(profile);
      mockResume.findFirst.mockResolvedValue(existing);
      mockResumeVersion.findUnique.mockResolvedValue(versionRecord);

      await expect(
        service.restoreVersion('resume-id', 'v-1', 'user-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // -----------------------------------------------------------------------
  // Versioning: compareVersions
  // -----------------------------------------------------------------------
  describe('compareVersions', () => {
    it('returns both version snapshots', async () => {
      const profile = aProfile();
      const existing = aResume();
      const vA = {
        id: 'v-a',
        version: 1,
        resumeId: 'resume-id',
        snapshot: { title: 'Initial' },
      };
      const vB = {
        id: 'v-b',
        version: 2,
        resumeId: 'resume-id',
        snapshot: { title: 'Updated' },
      };

      profileService.findByUserId.mockResolvedValue(profile);
      mockResume.findFirst.mockResolvedValue(existing);
      mockResumeVersion.findUnique
        .mockResolvedValueOnce(vA)
        .mockResolvedValueOnce(vB);

      const result = await service.compareVersions(
        'resume-id',
        'v-a',
        'v-b',
        'user-id',
      );

      expect(result.versionA.id).toBe('v-a');
      expect(result.versionB.id).toBe('v-b');
    });

    it('throws NotFoundException when either version is missing', async () => {
      const profile = aProfile();
      const existing = aResume();

      profileService.findByUserId.mockResolvedValue(profile);
      mockResume.findFirst.mockResolvedValue(existing);
      mockResumeVersion.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'v-b', resumeId: 'resume-id' });

      await expect(
        service.compareVersions('resume-id', 'v-a', 'v-b', 'user-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
