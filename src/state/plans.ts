import { useSyncExternalStore } from 'react';
import { isSlotCode } from '../data/slots';
import type { Course, CourseDraft, Plan } from '../lib/types';

export interface PlansState {
  plans: Plan[];
  activeId: string;
  chosenId: string | null;
  compareIds: string[];
}

export const TINT_COUNT = 10;

const STORAGE_KEY = 'ffcs-planner:plans';
const MAX_COMPARED = 3;
const MIN_COMPARED = 2;

function createId(): string {
  return crypto.randomUUID();
}

function nextPlanName(plans: readonly Plan[]): string {
  const used = new Set(plans.map((plan) => plan.name));
  for (let index = 0; ; index += 1) {
    const letter = String.fromCharCode(65 + (index % 26));
    const name = `Plan ${index < 26 ? letter : `${letter}${Math.floor(index / 26)}`}`;
    if (!used.has(name)) return name;
  }
}

function copyName(name: string, plans: readonly Plan[]): string {
  const used = new Set(plans.map((plan) => plan.name));
  const base = `${name} copy`;
  if (!used.has(base)) return base;
  for (let count = 2; ; count += 1) {
    const candidate = `${base} ${count}`;
    if (!used.has(candidate)) return candidate;
  }
}

function nextTint(courses: readonly Course[]): number {
  const counts = Array.from({ length: TINT_COUNT }, () => 0);
  for (const course of courses) counts[course.tint] = (counts[course.tint] ?? 0) + 1;
  return counts.indexOf(Math.min(...counts));
}

function createDefaultState(): PlansState {
  const plan: Plan = { id: createId(), name: 'Plan A', courses: [] };
  return { plans: [plan], activeId: plan.id, chosenId: null, compareIds: [] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readCourse(value: unknown): Course | null {
  if (!isRecord(value)) return null;
  const { id, slots, name, code, venue, faculty, credits, tint } = value;
  if (typeof id !== 'string' || typeof name !== 'string' || !Array.isArray(slots)) return null;
  const validSlots = slots.filter((slot): slot is Course['slots'][number] => typeof slot === 'string' && isSlotCode(slot));
  if (validSlots.length === 0) return null;
  return {
    id,
    name,
    slots: validSlots,
    code: typeof code === 'string' ? code : '',
    venue: typeof venue === 'string' ? venue : '',
    faculty: typeof faculty === 'string' ? faculty : '',
    credits: typeof credits === 'number' ? credits : null,
    tint: typeof tint === 'number' && tint >= 0 && tint < TINT_COUNT ? tint : 0,
  };
}

function readPlan(value: unknown): Plan | null {
  if (!isRecord(value)) return null;
  const { id, name, courses } = value;
  if (typeof id !== 'string' || typeof name !== 'string' || !Array.isArray(courses)) return null;
  return {
    id,
    name,
    courses: courses.map(readCourse).filter((course): course is Course => course !== null),
  };
}

function loadState(): PlansState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !Array.isArray(parsed.plans)) return createDefaultState();
    const plans = parsed.plans.map(readPlan).filter((plan): plan is Plan => plan !== null);
    const first = plans[0];
    if (!first) return createDefaultState();
    const hasPlan = (id: unknown): id is string => plans.some((plan) => plan.id === id);
    return {
      plans,
      activeId: hasPlan(parsed.activeId) ? parsed.activeId : first.id,
      chosenId: hasPlan(parsed.chosenId) ? parsed.chosenId : null,
      compareIds: Array.isArray(parsed.compareIds) ? parsed.compareIds.filter(hasPlan) : [],
    };
  } catch {
    return createDefaultState();
  }
}

let state = loadState();
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function persist(next: PlansState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    return;
  }
}

function commit(next: PlansState): void {
  state = next;
  persist(next);
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): PlansState {
  return state;
}

window.addEventListener('storage', (event) => {
  if (event.key !== STORAGE_KEY) return;
  state = loadState();
  emit();
});

export function usePlans(): PlansState {
  return useSyncExternalStore(subscribe, getSnapshot);
}

function updatePlan(planId: string, update: (plan: Plan) => Plan): void {
  commit({ ...state, plans: state.plans.map((plan) => (plan.id === planId ? update(plan) : plan)) });
}

export function selectActivePlan(current: PlansState): Plan {
  const plan = current.plans.find((entry) => entry.id === current.activeId) ?? current.plans[0];
  if (!plan) throw new Error('Planner state has no plans');
  return plan;
}

export function selectComparedPlans(current: PlansState): Plan[] {
  const selected = current.compareIds
    .map((id) => current.plans.find((plan) => plan.id === id))
    .filter((plan): plan is Plan => plan !== undefined)
    .slice(0, MAX_COMPARED);
  for (const plan of current.plans) {
    if (selected.length >= MIN_COMPARED) break;
    if (!selected.includes(plan)) selected.push(plan);
  }
  return selected;
}

export function toggleCompared(planId: string): void {
  const selected = selectComparedPlans(state).map((plan) => plan.id);
  if (selected.includes(planId)) {
    if (selected.length <= MIN_COMPARED) return;
    commit({ ...state, compareIds: selected.filter((id) => id !== planId) });
    return;
  }
  if (selected.length >= MAX_COMPARED) return;
  commit({ ...state, compareIds: [...selected, planId] });
}

export function setActivePlan(planId: string): void {
  commit({ ...state, activeId: planId });
}

export function createPlan(): void {
  const plan: Plan = { id: createId(), name: nextPlanName(state.plans), courses: [] };
  commit({ ...state, plans: [...state.plans, plan], activeId: plan.id });
}

export function duplicatePlan(planId: string): void {
  const index = state.plans.findIndex((plan) => plan.id === planId);
  const source = state.plans[index];
  if (!source) return;
  const copy: Plan = {
    id: createId(),
    name: copyName(source.name, state.plans),
    courses: source.courses.map((course) => ({ ...course, id: createId(), slots: [...course.slots] })),
  };
  const plans = [...state.plans];
  plans.splice(index + 1, 0, copy);
  commit({ ...state, plans, activeId: copy.id });
}

export function renamePlan(planId: string, name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  updatePlan(planId, (plan) => ({ ...plan, name: trimmed }));
}

export function deletePlan(planId: string): void {
  if (state.plans.length <= 1) return;
  const index = state.plans.findIndex((plan) => plan.id === planId);
  const plans = state.plans.filter((plan) => plan.id !== planId);
  const neighbour = plans[Math.max(0, index - 1)];
  commit({
    plans,
    activeId: state.activeId === planId && neighbour ? neighbour.id : state.activeId,
    chosenId: state.chosenId === planId ? null : state.chosenId,
    compareIds: state.compareIds.filter((id) => id !== planId),
  });
}

export function toggleChosen(planId: string): void {
  commit({ ...state, chosenId: state.chosenId === planId ? null : planId });
}

export function clearPlan(planId: string): void {
  updatePlan(planId, (plan) => ({ ...plan, courses: [] }));
}

export function addCourse(planId: string, draft: CourseDraft): void {
  updatePlan(planId, (plan) => ({
    ...plan,
    courses: [...plan.courses, { ...draft, id: createId(), tint: nextTint(plan.courses) }],
  }));
}

export function updateCourse(planId: string, courseId: string, draft: CourseDraft): void {
  updatePlan(planId, (plan) => ({
    ...plan,
    courses: plan.courses.map((course) => (course.id === courseId ? { ...course, ...draft } : course)),
  }));
}

export function deleteCourse(planId: string, courseId: string): void {
  updatePlan(planId, (plan) => ({
    ...plan,
    courses: plan.courses.filter((course) => course.id !== courseId),
  }));
}
