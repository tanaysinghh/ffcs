import { isSlotCode, type SlotCode } from '../data/slots';
import { parseSlotInput } from './parse';
import { courseLabel, type Course, type CourseDraft } from './types';

export interface CourseFields {
  slots: string;
  name: string;
  code: string;
  venue: string;
  faculty: string;
  credits: string;
}

export interface CourseErrors {
  slots: string[];
  name?: string;
  credits?: string;
}

export type CourseValidation = { ok: true; draft: CourseDraft } | { ok: false; errors: CourseErrors };

const MAX_CREDITS = 50;

export function validateSlots(raw: string, courses: readonly Course[], ignoreCourseId?: string): string[] {
  const codes = parseSlotInput(raw);
  if (codes.length === 0) return ['Enter at least one slot.'];

  const unknown = codes.filter((code) => !isSlotCode(code));
  const held = new Map<string, Course>();
  for (const course of courses) {
    if (course.id === ignoreCourseId) continue;
    for (const slot of course.slots) held.set(slot, course);
  }

  const messages: string[] = [];
  if (unknown.length > 0) {
    messages.push(`Unknown slot${unknown.length > 1 ? 's' : ''}: ${unknown.join(', ')}`);
  }
  for (const code of codes) {
    const holder = held.get(code);
    if (holder) messages.push(`${code} is already used by ${courseLabel(holder)}`);
  }
  return messages;
}

export function validateCourse(
  fields: CourseFields,
  courses: readonly Course[],
  ignoreCourseId?: string,
): CourseValidation {
  const errors: CourseErrors = { slots: validateSlots(fields.slots, courses, ignoreCourseId) };
  const name = fields.name.trim();
  if (!name) errors.name = 'Enter a course name.';

  const creditsText = fields.credits.trim();
  const credits = creditsText === '' ? null : Number(creditsText);
  if (credits !== null && (!Number.isFinite(credits) || credits < 0 || credits > MAX_CREDITS)) {
    errors.credits = `Credits must be a number from 0 to ${MAX_CREDITS}.`;
  }

  if (errors.slots.length > 0 || errors.name || errors.credits) return { ok: false, errors };

  return {
    ok: true,
    draft: {
      slots: parseSlotInput(fields.slots).filter((code): code is SlotCode => isSlotCode(code)),
      name,
      code: fields.code.trim(),
      venue: fields.venue.trim(),
      faculty: fields.faculty.trim(),
      credits,
    },
  };
}
