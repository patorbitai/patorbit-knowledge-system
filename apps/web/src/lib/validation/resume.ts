'use client';

import { z } from 'zod';

export const personalInfoSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').optional(),
  website: z.string().url('Invalid website URL').optional(),
});

export const summarySchema = z.object({
  summary: z
    .string()
    .min(20, 'Summary must be at least 20 characters')
    .max(500, 'Summary cannot exceed 500 characters'),
});

export const workExperienceSchema = z.object({
  company: z.string().min(1, 'Company name is required'),
  title: z.string().min(1, 'Job title is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

export const educationSchema = z.object({
  institution: z.string().min(1, 'Institution name is required'),
  degree: z.string().min(1, 'Degree is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  description: z.string().optional(),
});

export const projectsSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().min(1, 'Description is required'),
  url: z.string().url('Invalid URL').optional(),
});

export const skillsSchema = z.object({
  items: z
    .array(z.string().min(1, 'Skill cannot be empty'))
    .min(1, 'At least one skill is required'),
});

export const certificationsSchema = z.object({
  name: z.string().min(1, 'Certification name is required'),
  issuer: z.string().min(1, 'Issuer is required'),
  date: z.string().optional(),
});

export const achievementsSchema = z.object({
  name: z.string().min(1, 'Achievement name is required'),
  issuer: z.string().min(1, 'Issuer is required'),
  date: z.string().optional(),
});

export const languagesSchema = z.object({
  language: z.string().min(1, 'Language name is required'),
  proficiency: z.string().min(1, 'Proficiency level is required'),
});

export const interestsSchema = z.object({
  items: z
    .array(z.string().min(1, 'Interest cannot be empty'))
    .min(1, 'At least one interest is required'),
});

export const customSectionSchema = z.record(z.any());

// Types
export type PersonalInfoForm = z.infer<typeof personalInfoSchema>;
export type SummaryForm = z.infer<typeof summarySchema>;
export type WorkExperienceForm = z.infer<typeof workExperienceSchema>;
export type EducationForm = z.infer<typeof educationSchema>;
export type ProjectsForm = z.infer<typeof projectsSchema>;
export type SkillsForm = z.infer<typeof skillsSchema>;
export type CertificationsForm = z.infer<typeof certificationsSchema>;
export type AchievementsForm = z.infer<typeof achievementsSchema>;
export type LanguagesForm = z.infer<typeof languagesSchema>;
export type InterestsForm = z.infer<typeof interestsSchema>;
export type CustomSectionForm = z.infer<typeof customSectionSchema>;

// Get schema for a specific section type
export function getSectionSchema(sectionType: string): z.ZodSchema | null {
  switch (sectionType.toUpperCase()) {
    case 'PERSONAL_INFORMATION':
      return personalInfoSchema;
    case 'PROFESSIONAL_SUMMARY':
      return summarySchema;
    case 'WORK_EXPERIENCE':
    case 'VOLUNTEER_EXPERIENCE':
      return workExperienceSchema;
    case 'EDUCATION':
      return educationSchema;
    case 'PROJECTS':
      return projectsSchema;
    case 'SKILLS':
      return skillsSchema;
    case 'CERTIFICATIONS':
      return certificationsSchema;
    case 'ACHIEVEMENTS':
      return achievementsSchema;
    case 'LANGUAGES':
      return languagesSchema;
    case 'INTERESTS':
      return interestsSchema;
    case 'CUSTOM':
      return customSectionSchema;
    default:
      return null;
  }
}
