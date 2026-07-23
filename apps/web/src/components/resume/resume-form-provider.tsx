'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { createContext, useContext, useEffect, useMemo } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { useResumeStore } from '@/lib/stores/use-resume-store';
import { type Resume } from '@/lib/types';

// 1. Zod schema for validation
const resumeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  sections: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      title: z.string().nullable(),
      // content is a flexible object, so we'll use z.record(z.any())
      content: z.record(z.any()).nullable(),
      // other fields are not form-editable
    }),
  ),
});

// 2. Create a context for the form
interface ResumeFormContextValue {
  resume: Resume;
}

const ResumeFormContext = createContext<ResumeFormContextValue | null>(null);

// 3. Create the provider component
export function ResumeFormProvider({
  resume,
  children,
}: {
  resume: Resume;
  children: React.ReactNode;
}) {
  const methods = useForm<Resume>({
    resolver: zodResolver(resumeSchema),
    defaultValues: useMemo(() => resume, [resume]),
  });

  // Keep defaultValues in sync with external changes
  useEffect(() => {
    methods.reset(resume);
  }, [resume, methods]);

  return (
    <FormProvider {...methods}>
      <ResumeFormContext.Provider value={{ resume }}>
        <SyncWithZustand />
        {children}
      </ResumeFormContext.Provider>
    </FormProvider>
  );
}

// 4. Custom hook to access the form context
export function useResumeForm() {
  const context = useContext(ResumeFormContext);
  if (!context) {
    throw new Error('useResumeForm must be used within a ResumeFormProvider');
  }
  return context;
}

// 5. Component to sync RHF state back to Zustand for live preview
function SyncWithZustand() {
  const { control } = useForm<Resume>();
  const entireFormState = useWatch({ control });

  const setResumeInStore = useResumeStore((s) => s.setResume);

  useEffect(() => {
    if (entireFormState && Object.keys(entireFormState).length > 0) {
      // This will update the zustand store, which in turn updates the preview
      setResumeInStore(entireFormState as Resume);
    }
  }, [entireFormState, setResumeInStore]);

  return null;
}
