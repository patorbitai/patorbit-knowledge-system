import { describe, expect, it } from 'vitest';

import {
  achievementsSchema,
  certificationsSchema,
  customSectionSchema,
  educationSchema,
  getSectionSchema,
  interestsSchema,
  languagesSchema,
  personalInfoSchema,
  projectsSchema,
  skillsSchema,
  summarySchema,
  workExperienceSchema,
} from './resume';

describe('personalInfoSchema', () => {
  const valid = {
    fullName: 'John Doe',
    email: 'john@example.com',
  };

  it('accepts valid personal info', () => {
    expect(personalInfoSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts optional fields', () => {
    const data = {
      ...valid,
      phone: '+1-555-1234',
      location: 'San Francisco, CA',
      linkedinUrl: 'https://linkedin.com/in/johndoe',
      website: 'https://johndoe.com',
    };
    expect(personalInfoSchema.safeParse(data).success).toBe(true);
  });

  it('rejects short fullName', () => {
    const result = personalInfoSchema.safeParse({ ...valid, fullName: 'J' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('at least 2');
    }
  });

  it('rejects invalid email', () => {
    const result = personalInfoSchema.safeParse({ ...valid, email: 'not-an-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('Invalid email');
    }
  });

  it('rejects invalid linkedinUrl', () => {
    const result = personalInfoSchema.safeParse({ ...valid, linkedinUrl: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid website', () => {
    const result = personalInfoSchema.safeParse({ ...valid, website: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('rejects empty object', () => {
    expect(personalInfoSchema.safeParse({}).success).toBe(false);
  });
});

describe('summarySchema', () => {
  const valid = {
    summary: 'A'.repeat(50),
  };

  it('accepts valid summary', () => {
    expect(summarySchema.safeParse(valid).success).toBe(true);
  });

  it('accepts summary at min boundary (20 chars)', () => {
    expect(summarySchema.safeParse({ summary: 'A'.repeat(20) }).success).toBe(true);
  });

  it('accepts summary at max boundary (500 chars)', () => {
    expect(summarySchema.safeParse({ summary: 'A'.repeat(500) }).success).toBe(true);
  });

  it('rejects summary under 20 characters', () => {
    const result = summarySchema.safeParse({ summary: 'Too short' });
    expect(result.success).toBe(false);
  });

  it('rejects summary over 500 characters', () => {
    const result = summarySchema.safeParse({ summary: 'A'.repeat(501) });
    expect(result.success).toBe(false);
  });
});

describe('workExperienceSchema', () => {
  const valid = {
    company: 'Tech Corp',
    title: 'Software Engineer',
    startDate: 'Jan 2020',
    description: 'A'.repeat(15),
  };

  it('accepts valid work experience', () => {
    expect(workExperienceSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts optional endDate', () => {
    const data = { ...valid, endDate: 'Dec 2022' };
    expect(workExperienceSchema.safeParse(data).success).toBe(true);
  });

  it('rejects missing company', () => {
    const { company, ...noCompany } = valid;
    expect(workExperienceSchema.safeParse(noCompany).success).toBe(false);
  });

  it('rejects missing title', () => {
    const { title, ...noTitle } = valid;
    expect(workExperienceSchema.safeParse(noTitle).success).toBe(false);
  });

  it('rejects description under 10 characters', () => {
    const result = workExperienceSchema.safeParse({ ...valid, description: 'Short' });
    expect(result.success).toBe(false);
  });
});

describe('educationSchema', () => {
  const valid = {
    institution: 'MIT',
    degree: 'BSc Computer Science',
    startDate: 'Sep 2016',
  };

  it('accepts valid education', () => {
    expect(educationSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts optional endDate and description', () => {
    expect(
      educationSchema.safeParse({
        ...valid,
        endDate: 'Jun 2020',
        description: 'Graduated with honors',
      }).success,
    ).toBe(true);
  });

  it('rejects empty institution', () => {
    expect(educationSchema.safeParse({ ...valid, institution: '' }).success).toBe(false);
  });
});

describe('projectsSchema', () => {
  const valid = {
    name: 'Project Alpha',
    description: 'A web application',
  };

  it('accepts valid project', () => {
    expect(projectsSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts optional URL', () => {
    expect(projectsSchema.safeParse({ ...valid, url: 'https://project.com' }).success).toBe(true);
  });

  it('rejects invalid URL', () => {
    const result = projectsSchema.safeParse({ ...valid, url: 'bad-url' });
    expect(result.success).toBe(false);
  });
});

describe('skillsSchema', () => {
  it('accepts valid skills list', () => {
    expect(skillsSchema.safeParse({ items: ['TypeScript', 'React'] }).success).toBe(true);
  });

  it('rejects empty skills array', () => {
    const result = skillsSchema.safeParse({ items: [] });
    expect(result.success).toBe(false);
  });

  it('rejects array with empty string', () => {
    const result = skillsSchema.safeParse({ items: [''] });
    expect(result.success).toBe(false);
  });
});

describe('certificationsSchema', () => {
  const valid = {
    name: 'AWS Solutions Architect',
    issuer: 'Amazon',
  };

  it('accepts valid certification', () => {
    expect(certificationsSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts optional date', () => {
    expect(certificationsSchema.safeParse({ ...valid, date: '2024-01-15' }).success).toBe(true);
  });

  it('rejects empty name', () => {
    expect(certificationsSchema.safeParse({ ...valid, name: '' }).success).toBe(false);
  });
});

describe('achievementsSchema', () => {
  const valid = {
    name: 'Employee of the Month',
    issuer: 'Tech Corp',
  };

  it('accepts valid achievement', () => {
    expect(achievementsSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects empty issuer', () => {
    expect(achievementsSchema.safeParse({ ...valid, issuer: '' }).success).toBe(false);
  });
});

describe('languagesSchema', () => {
  it('accepts valid language entry', () => {
    expect(languagesSchema.safeParse({ language: 'English', proficiency: 'Native' }).success).toBe(
      true,
    );
  });

  it('rejects empty language', () => {
    expect(languagesSchema.safeParse({ language: '', proficiency: 'Native' }).success).toBe(false);
  });
});

describe('interestsSchema', () => {
  it('accepts valid interests list', () => {
    expect(interestsSchema.safeParse({ items: ['Reading', 'Coding'] }).success).toBe(true);
  });

  it('rejects empty interests array', () => {
    expect(interestsSchema.safeParse({ items: [] }).success).toBe(false);
  });
});

describe('customSectionSchema', () => {
  it('accepts any record', () => {
    expect(customSectionSchema.safeParse({ foo: 'bar', num: 42 }).success).toBe(true);
  });

  it('accepts empty object', () => {
    expect(customSectionSchema.safeParse({}).success).toBe(true);
  });
});

describe('getSectionSchema', () => {
  it('returns personalInfoSchema for PERSONAL_INFORMATION', () => {
    expect(getSectionSchema('PERSONAL_INFORMATION')).toBe(personalInfoSchema);
  });

  it('returns summarySchema for PROFESSIONAL_SUMMARY', () => {
    expect(getSectionSchema('PROFESSIONAL_SUMMARY')).toBe(summarySchema);
  });

  it('returns workExperienceSchema for WORK_EXPERIENCE', () => {
    expect(getSectionSchema('WORK_EXPERIENCE')).toBe(workExperienceSchema);
  });

  it('returns workExperienceSchema for VOLUNTEER_EXPERIENCE', () => {
    expect(getSectionSchema('VOLUNTEER_EXPERIENCE')).toBe(workExperienceSchema);
  });

  it('returns educationSchema for EDUCATION', () => {
    expect(getSectionSchema('EDUCATION')).toBe(educationSchema);
  });

  it('returns projectsSchema for PROJECTS', () => {
    expect(getSectionSchema('PROJECTS')).toBe(projectsSchema);
  });

  it('returns skillsSchema for SKILLS', () => {
    expect(getSectionSchema('SKILLS')).toBe(skillsSchema);
  });

  it('returns certificationsSchema for CERTIFICATIONS', () => {
    expect(getSectionSchema('CERTIFICATIONS')).toBe(certificationsSchema);
  });

  it('returns achievementsSchema for ACHIEVEMENTS', () => {
    expect(getSectionSchema('ACHIEVEMENTS')).toBe(achievementsSchema);
  });

  it('returns languagesSchema for LANGUAGES', () => {
    expect(getSectionSchema('LANGUAGES')).toBe(languagesSchema);
  });

  it('returns interestsSchema for INTERESTS', () => {
    expect(getSectionSchema('INTERESTS')).toBe(interestsSchema);
  });

  it('returns customSectionSchema for CUSTOM', () => {
    expect(getSectionSchema('CUSTOM')).toBe(customSectionSchema);
  });

  it('handles case-insensitive input', () => {
    expect(getSectionSchema('personal_information')).toBe(personalInfoSchema);
  });

  it('returns null for unknown types', () => {
    expect(getSectionSchema('UNKNOWN_TYPE')).toBeNull();
  });
});
