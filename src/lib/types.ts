import type { SlotCode } from '../data/slots';

export interface CourseDraft {
  slots: SlotCode[];
  name: string;
  code: string;
  venue: string;
  faculty: string;
  credits: number | null;
}

export interface Course extends CourseDraft {
  id: string;
  tint: number;
}

export interface Plan {
  id: string;
  name: string;
  courses: Course[];
}

export function courseLabel(course: Pick<Course, 'code' | 'name'>): string {
  return course.code || course.name;
}

export function totalCredits(courses: readonly Course[]): number {
  return courses.reduce((sum, course) => sum + (course.credits ?? 0), 0);
}
