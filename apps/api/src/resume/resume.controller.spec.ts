import { Test, type TestingModule } from '@nestjs/testing';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockResumeService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  duplicate: jest.fn(),
  archive: jest.fn(),
  findRecent: jest.fn(),
  findDrafts: jest.fn(),
  listVersions: jest.fn(),
  createVersion: jest.fn(),
  restoreVersion: jest.fn(),
  compareVersions: jest.fn(),
};

/**
 * Always-allow guard so controllers can be tested in isolation.
 */
const mockJwtAuthGuard = {
  canActivate: jest.fn((context: ExecutionContext) => true),
};

const mockUser = { sub: 'user-id', email: 'test@example.com' };

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------
describe('ResumeController', () => {
  let controller: ResumeController;
  let resumeService: typeof mockResumeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResumeController],
      providers: [
        { provide: ResumeService, useValue: mockResumeService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<ResumeController>(ResumeController);
    resumeService = module.get(ResumeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // -----------------------------------------------------------------------
  // POST /resumes
  // -----------------------------------------------------------------------
  describe('POST /resumes (create)', () => {
    it('delegates to resumeService.create with dto and user.sub', async () => {
      const dto = { title: 'My Resume' };
      const expected = { id: 'r-1', ...dto };
      resumeService.create.mockResolvedValue(expected);

      const result = await controller.create(dto, mockUser);

      expect(resumeService.create).toHaveBeenCalledWith(dto, 'user-id');
      expect(result).toEqual(expected);
    });
  });

  // -----------------------------------------------------------------------
  // GET /resumes
  // -----------------------------------------------------------------------
  describe('GET /resumes (findAll)', () => {
    it('delegates to resumeService.findAll with query and user.sub', async () => {
      const query = { page: 1, limit: 20 };
      const expected = { data: [], meta: { total: 0, page: 1, limit: 20, lastPage: 0 } };
      resumeService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(query, mockUser);

      expect(resumeService.findAll).toHaveBeenCalledWith(query, 'user-id');
      expect(result).toEqual(expected);
    });
  });

  // -----------------------------------------------------------------------
  // GET /resumes/recent
  // -----------------------------------------------------------------------
  describe('GET /resumes/recent (findRecent)', () => {
    it('delegates to resumeService.findRecent with user.sub', async () => {
      const expected = [{ id: 'r-1' }];
      resumeService.findRecent.mockResolvedValue(expected);

      const result = await controller.findRecent(mockUser);

      expect(resumeService.findRecent).toHaveBeenCalledWith('user-id');
      expect(result).toEqual(expected);
    });
  });

  // -----------------------------------------------------------------------
  // GET /resumes/drafts
  // -----------------------------------------------------------------------
  describe('GET /resumes/drafts (findDrafts)', () => {
    it('delegates to resumeService.findDrafts with user.sub', async () => {
      const expected = [{ id: 'd-1', status: 'DRAFT' }];
      resumeService.findDrafts.mockResolvedValue(expected);

      const result = await controller.findDrafts(mockUser);

      expect(resumeService.findDrafts).toHaveBeenCalledWith('user-id');
      expect(result).toEqual(expected);
    });
  });

  // -----------------------------------------------------------------------
  // GET /resumes/:id
  // -----------------------------------------------------------------------
  describe('GET /resumes/:id (findOne)', () => {
    it('delegates to resumeService.findOne with id and user.sub', async () => {
      const expected = { id: 'r-1' };
      resumeService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne('r-1', mockUser);

      expect(resumeService.findOne).toHaveBeenCalledWith('r-1', 'user-id');
      expect(result).toEqual(expected);
    });
  });

  // -----------------------------------------------------------------------
  // PATCH /resumes/:id
  // -----------------------------------------------------------------------
  describe('PATCH /resumes/:id (update)', () => {
    it('delegates to resumeService.update with id, dto, and user.sub', async () => {
      const dto = { title: 'Updated' };
      const expected = { id: 'r-1', title: 'Updated' };
      resumeService.update.mockResolvedValue(expected);

      const result = await controller.update('r-1', dto, mockUser);

      expect(resumeService.update).toHaveBeenCalledWith('r-1', dto, 'user-id');
      expect(result).toEqual(expected);
    });
  });

  // -----------------------------------------------------------------------
  // DELETE /resumes/:id
  // -----------------------------------------------------------------------
  describe('DELETE /resumes/:id (remove)', () => {
    it('delegates to resumeService.softDelete with id and user.sub', async () => {
      resumeService.softDelete.mockResolvedValue({ id: 'r-1', deletedAt: new Date() });

      const result = await controller.remove('r-1', mockUser);

      expect(resumeService.softDelete).toHaveBeenCalledWith('r-1', 'user-id');
      expect(result).toBeUndefined(); // HttpCode(NO_CONTENT) — no explicit return
    });
  });

  // -----------------------------------------------------------------------
  // POST /resumes/:id/duplicate
  // -----------------------------------------------------------------------
  describe('POST /resumes/:id/duplicate (duplicate)', () => {
    it('delegates to resumeService.duplicate with id, dto, and user.sub', async () => {
      const dto = { title: 'Copy' };
      const expected = { id: 'copy-id' };
      resumeService.duplicate.mockResolvedValue(expected);

      const result = await controller.duplicate('r-1', dto, mockUser);

      expect(resumeService.duplicate).toHaveBeenCalledWith('r-1', dto, 'user-id');
      expect(result).toEqual(expected);
    });
  });

  // -----------------------------------------------------------------------
  // POST /resumes/:id/archive
  // -----------------------------------------------------------------------
  describe('POST /resumes/:id/archive (archive)', () => {
    it('delegates to resumeService.archive with id and user.sub', async () => {
      const expected = { id: 'r-1', status: 'ARCHIVED' };
      resumeService.archive.mockResolvedValue(expected);

      const result = await controller.archive('r-1', mockUser);

      expect(resumeService.archive).toHaveBeenCalledWith('r-1', 'user-id');
      expect(result).toEqual(expected);
    });
  });

  // -----------------------------------------------------------------------
  // GET /resumes/:id/versions
  // -----------------------------------------------------------------------
  describe('GET /resumes/:id/versions (listVersions)', () => {
    it('delegates to resumeService.listVersions with id and user.sub', async () => {
      const expected = [{ id: 'v-1', version: 1 }];
      resumeService.listVersions.mockResolvedValue(expected);

      const result = await controller.listVersions('r-1', mockUser);

      expect(resumeService.listVersions).toHaveBeenCalledWith('r-1', 'user-id');
      expect(result).toEqual(expected);
    });
  });

  // -----------------------------------------------------------------------
  // POST /resumes/:id/versions
  // -----------------------------------------------------------------------
  describe('POST /resumes/:id/versions (createVersion)', () => {
    it('delegates to resumeService.createVersion with id, note, and user.sub', async () => {
      const expected = { id: 'v-1', version: 2, note: 'Snapshot' };
      resumeService.createVersion.mockResolvedValue(expected);

      const result = await controller.createVersion('r-1', 'Snapshot', mockUser);

      expect(resumeService.createVersion).toHaveBeenCalledWith('r-1', 'Snapshot', 'user-id');
      expect(result).toEqual(expected);
    });
  });

  // -----------------------------------------------------------------------
  // POST /resumes/:id/versions/:versionId/restore
  // -----------------------------------------------------------------------
  describe('POST /resumes/:id/versions/:versionId/restore (restoreVersion)', () => {
    it('delegates to resumeService.restoreVersion with id, versionId, and user.sub', async () => {
      const expected = { id: 'r-1', title: 'Restored' };
      resumeService.restoreVersion.mockResolvedValue(expected);

      const result = await controller.restoreVersion('r-1', 'v-1', mockUser);

      expect(resumeService.restoreVersion).toHaveBeenCalledWith('r-1', 'v-1', 'user-id');
      expect(result).toEqual(expected);
    });
  });

  // -----------------------------------------------------------------------
  // GET /resumes/:id/versions/:versionAId/compare/:versionBId
  // -----------------------------------------------------------------------
  describe('GET /resumes/:id/versions/:vA/compare/:vB (compareVersions)', () => {
    it('delegates to resumeService.compareVersions with both version IDs and user.sub', async () => {
      const expected = {
        versionA: { id: 'v-a', snapshot: {} },
        versionB: { id: 'v-b', snapshot: {} },
      };
      resumeService.compareVersions.mockResolvedValue(expected);

      const result = await controller.compareVersions('r-1', 'v-a', 'v-b', mockUser);

      expect(resumeService.compareVersions).toHaveBeenCalledWith('r-1', 'v-a', 'v-b', 'user-id');
      expect(result).toEqual(expected);
    });
  });
});
