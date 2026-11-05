import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { Course, CourseDraft } from '../lib/types';
import { validateCourse, type CourseErrors, type CourseFields } from '../lib/validate';
import { Button } from './Button';

interface CourseFormProps {
  scopeId: string;
  courses: readonly Course[];
  editing?: Course;
  submitLabel: string;
  onSubmit: (draft: CourseDraft) => void;
  onCancel?: () => void;
  onDelete?: () => void;
}

const EMPTY_FIELDS: CourseFields = { slots: '', name: '', code: '', venue: '', faculty: '', credits: '' };
const NO_ERRORS: CourseErrors = { slots: [] };

const INPUT_CLASS =
  'h-11 w-full rounded-lg border border-line bg-surface px-3 text-base text-ink transition-colors duration-150 placeholder:text-ink-faint hover:border-ink-faint aria-invalid:border-danger sm:text-sm lg:h-10';

function fieldsFromCourse(course: Course): CourseFields {
  return {
    slots: course.slots.join('+'),
    name: course.name,
    code: course.code,
    venue: course.venue,
    faculty: course.faculty,
    credits: course.credits === null ? '' : String(course.credits),
  };
}

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  errors?: readonly string[];
  children: ReactNode;
}

function Field({ id, label, required = false, hint, errors = [], children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-0.5 text-danger">
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-soft">
          {hint}
        </p>
      ) : null}
      {errors.length > 0 ? (
        <ul id={`${id}-error`} role="alert" className="mt-1.5 space-y-0.5 text-sm text-danger">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function describedBy(id: string, hasHint: boolean, hasError: boolean): string | undefined {
  const ids = [hasHint ? `${id}-hint` : '', hasError ? `${id}-error` : ''].filter(Boolean);
  return ids.length > 0 ? ids.join(' ') : undefined;
}

export function CourseForm({ scopeId, courses, editing, submitLabel, onSubmit, onCancel, onDelete }: CourseFormProps) {
  const baseId = useId();
  const [fields, setFields] = useState<CourseFields>(() => (editing ? fieldsFromCourse(editing) : EMPTY_FIELDS));
  const [errors, setErrors] = useState<CourseErrors>(NO_ERRORS);
  const slotsRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const creditsRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setErrors(NO_ERRORS);
  }, [scopeId]);

  const setField = (key: keyof CourseFields, value: string) => {
    setFields((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (key === 'slots') return { ...current, slots: [] };
      if (key === 'name' || key === 'credits') return { ...current, [key]: undefined };
      return current;
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = validateCourse(fields, courses, editing?.id);
    if (!result.ok) {
      setErrors(result.errors);
      if (result.errors.slots.length > 0) slotsRef.current?.focus();
      else if (result.errors.name) nameRef.current?.focus();
      else creditsRef.current?.focus();
      return;
    }
    setErrors(NO_ERRORS);
    onSubmit(result.draft);
    if (!editing) {
      setFields(EMPTY_FIELDS);
      slotsRef.current?.focus();
    }
  };

  const ids = {
    slots: `${baseId}-slots`,
    name: `${baseId}-name`,
    code: `${baseId}-code`,
    venue: `${baseId}-venue`,
    faculty: `${baseId}-faculty`,
    credits: `${baseId}-credits`,
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-4">
      <Field
        id={ids.slots}
        label="Slots"
        required
        hint="Separate with +, a comma or a space."
        errors={errors.slots}
      >
        <input
          ref={slotsRef}
          id={ids.slots}
          value={fields.slots}
          onChange={(event) => setField('slots', event.target.value)}
          placeholder="e.g. A11+B12"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          required
          aria-invalid={errors.slots.length > 0}
          aria-describedby={describedBy(ids.slots, true, errors.slots.length > 0)}
          className={INPUT_CLASS}
        />
      </Field>

      <Field id={ids.name} label="Course name" required errors={errors.name ? [errors.name] : []}>
        <input
          ref={nameRef}
          id={ids.name}
          value={fields.name}
          onChange={(event) => setField('name', event.target.value)}
          placeholder="e.g. Data Structures"
          autoComplete="off"
          required
          aria-invalid={Boolean(errors.name)}
          aria-describedby={describedBy(ids.name, false, Boolean(errors.name))}
          className={INPUT_CLASS}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field id={ids.code} label="Course code">
          <input
            id={ids.code}
            value={fields.code}
            onChange={(event) => setField('code', event.target.value)}
            placeholder="e.g. CSE1001"
            autoComplete="off"
            className={INPUT_CLASS}
          />
        </Field>
        <Field id={ids.venue} label="Venue">
          <input
            id={ids.venue}
            value={fields.venue}
            onChange={(event) => setField('venue', event.target.value)}
            placeholder="e.g. AB-101"
            autoComplete="off"
            className={INPUT_CLASS}
          />
        </Field>
      </div>

      <div className="grid grid-cols-[1fr_6rem] gap-3">
        <Field id={ids.faculty} label="Faculty">
          <input
            id={ids.faculty}
            value={fields.faculty}
            onChange={(event) => setField('faculty', event.target.value)}
            autoComplete="off"
            className={INPUT_CLASS}
          />
        </Field>
        <Field id={ids.credits} label="Credits">
          <input
            ref={creditsRef}
            id={ids.credits}
            type="number"
            inputMode="decimal"
            min={0}
            step={0.5}
            value={fields.credits}
            onChange={(event) => setField('credits', event.target.value)}
            aria-invalid={Boolean(errors.credits)}
            aria-describedby={describedBy(ids.credits, false, Boolean(errors.credits))}
            className={INPUT_CLASS}
          />
        </Field>
      </div>
      {errors.credits ? (
        <p id={`${ids.credits}-error`} role="alert" className="text-sm text-danger">
          {errors.credits}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {onDelete ? (
          <Button variant="danger" onClick={onDelete} className="mr-auto">
            Delete
          </Button>
        ) : null}
        {onCancel ? <Button onClick={onCancel}>Cancel</Button> : null}
        <Button type="submit" variant="primary" className={onCancel ? '' : 'w-full'}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
