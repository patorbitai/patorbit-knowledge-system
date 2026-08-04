"use client";
import { useState, useCallback } from "react";
import { useResumeBuilder } from "@/store/resume-builder";
import { validatePersonalSection, validateArraySection, getFieldError as getFieldErrorUtil, hasSectionErrors as hasSectionErrorsUtil, REQUIRED_FIELDS } from "@/utils/validation";
import type { ValidationErrors, ArrayValidationErrors } from "@/utils/validation";

export function useValidation() {
  const resume = useResumeBuilder((s) => s.resume);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, ValidationErrors | ArrayValidationErrors>>({});

  const touch = useCallback((field: string) => {
    setTouched((t) => ({ ...t, [field]: true }));
  }, []);

  const validate = useCallback(() => {
    const personalErrors = validatePersonalSection(resume);
    const experienceErrors = validateArraySection(resume.experience, REQUIRED_FIELDS.experience);
    const educationErrors = validateArraySection(resume.education, REQUIRED_FIELDS.education);
    const skillsErrors = validateArraySection(resume.skills, REQUIRED_FIELDS.skills);
    const projectsErrors = validateArraySection(resume.projects, REQUIRED_FIELDS.projects);
    const certificationsErrors = validateArraySection(resume.certifications, REQUIRED_FIELDS.certifications);

    const allErrors = {
      personal: personalErrors,
      experience: experienceErrors,
      education: educationErrors,
      skills: skillsErrors,
      projects: projectsErrors,
      certifications: certificationsErrors,
    };
    setErrors(allErrors);
    return allErrors;
  }, [resume]);

  const getFieldError = (section: string, fieldName: string, itemIndex: number | null = null) => {
    const key = itemIndex !== null ? `${section}.${itemIndex}.${fieldName}` : `${section}.${fieldName}`;
    if (!touched[key]) return undefined;
    return getFieldErrorUtil(section, fieldName, itemIndex, errors);
  };

  const hasSectionErrors = (section: string) => hasSectionErrorsUtil(section, errors);

  return { errors, touched, touch, validate, getFieldError, hasSectionErrors };
}
