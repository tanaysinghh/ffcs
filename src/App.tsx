import { BroomIcon, ColumnsIcon, DownloadSimpleIcon, GridNineIcon } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Button } from './components/Button';
import { CompareView } from './components/CompareView';
import { CourseForm } from './components/CourseForm';
import { CourseList } from './components/CourseList';
import { ExportSheet } from './components/ExportSheet';
import { Grid } from './components/Grid';
import { ConfirmDialog, Modal, type ConfirmRequest } from './components/Modal';
import { PlanTabs } from './components/PlanTabs';
import { ThemeToggle } from './components/ThemeToggle';
import { getToday } from './data/slots';
import { exportFileName, exportNode, type ExportFormat } from './lib/export';
import { courseLabel, type Course, type CourseDraft, type Plan } from './lib/types';
import {
  addCourse,
  clearPlan,
  deleteCourse,
  deletePlan,
  selectActivePlan,
  updateCourse,
  usePlans,
} from './state/plans';

type Mode = 'planner' | 'compare';

const NOTICE_DURATION_MS = 3500;

export default function App() {
  const state = usePlans();
  const active = selectActivePlan(state);
  const [mode, setMode] = useState<Mode>('planner');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const [notice, setNotice] = useState('');
  const [exportingPlan, setExportingPlan] = useState<Plan | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const today = getToday();
  const editing = active.courses.find((course) => course.id === editingId);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), NOTICE_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const handleAdd = (draft: CourseDraft) => {
    addCourse(active.id, draft);
    setNotice(`Added ${courseLabel(draft)} to ${active.name}`);
  };

  const handleSaveEdit = (draft: CourseDraft) => {
    if (!editing) return;
    updateCourse(active.id, editing.id, draft);
    setEditingId(null);
    setNotice(`Updated ${courseLabel(draft)}`);
  };

  const requestDeleteCourse = (course: Course) => {
    setConfirm({
      title: `Delete ${courseLabel(course)}?`,
      message: `This removes ${course.name} from ${active.name}.`,
      confirmLabel: 'Delete course',
      onConfirm: () => {
        deleteCourse(active.id, course.id);
        setEditingId(null);
        setNotice(`Deleted ${courseLabel(course)}`);
      },
    });
  };

  const requestDeletePlan = (plan: Plan) => {
    setConfirm({
      title: `Delete ${plan.name}?`,
      message: `This permanently removes the plan and its ${plan.courses.length} ${
        plan.courses.length === 1 ? 'course' : 'courses'
      }.`,
      confirmLabel: 'Delete plan',
      onConfirm: () => {
        deletePlan(plan.id);
        setNotice(`Deleted ${plan.name}`);
      },
    });
  };

  const requestClearPlan = () => {
    setConfirm({
      title: `Clear ${active.name}?`,
      message: `This removes all ${active.courses.length} courses from the plan. The plan itself stays.`,
      confirmLabel: 'Clear plan',
      onConfirm: () => {
        clearPlan(active.id);
        setNotice(`Cleared ${active.name}`);
      },
    });
  };

  const handleExport = async (format: ExportFormat) => {
    if (exportFormat) return;
    setExportFormat(format);
    flushSync(() => setExportingPlan(active));
    try {
      if (!sheetRef.current) throw new Error('Export sheet is not mounted');
      await exportNode(sheetRef.current, active.name, format);
      setNotice(`Saved ${exportFileName(active.name, format)}`);
    } catch {
      setNotice('Export failed. Please try again.');
    } finally {
      setExportingPlan(null);
      setExportFormat(null);
    }
  };

  return (
    <div className="min-h-dvh">
      <a
        href="#plan-panel"
        className="sr-only z-30 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-on-accent focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to timetable
      </a>

      <div className="mx-auto max-w-[1440px] px-4 pt-4 pb-16 sm:px-6 lg:pt-6">
        <header className="mb-5 flex items-center justify-between gap-3 lg:mb-7">
          <h1 className="font-display text-xl font-semibold tracking-tight whitespace-nowrap sm:text-2xl">
            FFCS Planner
          </h1>
          <div className="flex items-center gap-1 sm:gap-2">
            <div role="group" aria-label="View" className="flex rounded-xl bg-sunken p-1">
              {(
                [
                  { value: 'planner', label: 'Planner', icon: <GridNineIcon size={15} aria-hidden="true" /> },
                  { value: 'compare', label: 'Compare', icon: <ColumnsIcon size={15} aria-hidden="true" /> },
                ] as const
              ).map(({ value, label, icon }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={mode === value}
                  onClick={() => setMode(value)}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm transition duration-200 ease-out sm:px-3 lg:h-8 ${
                    mode === value
                      ? 'bg-surface font-semibold text-ink shadow-card'
                      : 'font-medium text-ink-soft hover:text-ink'
                  }`}
                >
                  <span className="hidden sm:inline">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
            <ThemeToggle />
          </div>
        </header>

        {mode === 'compare' ? (
          <main key="compare" className="animate-fade-up">
            <CompareView state={state} />
          </main>
        ) : (
          <main key="planner" className="animate-fade-up space-y-4">
            <PlanTabs
              plans={state.plans}
              activeId={state.activeId}
              chosenId={state.chosenId}
              onDelete={requestDeletePlan}
            />

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_21rem] xl:items-start xl:gap-6">
              <section
                id="plan-panel"
                role="tabpanel"
                tabIndex={-1}
                aria-labelledby={`plan-tab-${active.id}`}
                className="min-w-0 rounded-2xl border border-line bg-surface p-3 shadow-card sm:p-5"
              >
                <div className="mb-3 flex flex-wrap items-center justify-end gap-2 sm:mb-4">
                  <Button
                    variant="ghost"
                    compactLabel
                    className="mr-auto"
                    disabled={active.courses.length === 0}
                    onClick={requestClearPlan}
                    title="Clear all courses from this plan"
                    icon={<BroomIcon size={16} />}
                  >
                    Clear plan
                  </Button>
                  <Button
                    disabled={exportFormat !== null}
                    aria-label={`Download ${active.name} as PNG`}
                    onClick={() => void handleExport('png')}
                    icon={<DownloadSimpleIcon size={16} />}
                  >
                    {exportFormat === 'png' ? 'Saving…' : 'PNG'}
                  </Button>
                  <Button
                    disabled={exportFormat !== null}
                    aria-label={`Download ${active.name} as PDF`}
                    onClick={() => void handleExport('pdf')}
                    icon={<DownloadSimpleIcon size={16} />}
                  >
                    {exportFormat === 'pdf' ? 'Saving…' : 'PDF'}
                  </Button>
                </div>
                <div
                  tabIndex={0}
                  role="region"
                  aria-label={`${active.name} timetable, scrollable`}
                  className="overflow-x-auto rounded-lg"
                >
                  <Grid
                    label={`${active.name} timetable`}
                    courses={active.courses}
                    today={today}
                    onSelect={(course) => setEditingId(course.id)}
                  />
                </div>
              </section>

              <aside className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                <section
                  aria-labelledby="add-course-title"
                  className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5"
                >
                  <h2 id="add-course-title" className="mb-4 font-display text-base font-semibold">
                    Add a course
                  </h2>
                  <CourseForm
                    scopeId={active.id}
                    courses={active.courses}
                    submitLabel="Add to timetable"
                    onSubmit={handleAdd}
                  />
                </section>
                <section
                  aria-labelledby="courses-title"
                  className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5"
                >
                  <h2 id="courses-title" className="mb-3 font-display text-base font-semibold">
                    Courses in {active.name}
                  </h2>
                  <CourseList
                    courses={active.courses}
                    onEdit={(course) => setEditingId(course.id)}
                    onDelete={requestDeleteCourse}
                  />
                </section>
              </aside>
            </div>
          </main>
        )}
      </div>

      <Modal open={editing !== undefined} title="Edit course" onClose={() => setEditingId(null)}>
        {editing ? (
          <CourseForm
            key={editing.id}
            scopeId={editing.id}
            courses={active.courses}
            editing={editing}
            submitLabel="Save changes"
            onSubmit={handleSaveEdit}
            onCancel={() => setEditingId(null)}
            onDelete={() => requestDeleteCourse(editing)}
          />
        ) : null}
      </Modal>

      <ConfirmDialog request={confirm} onClose={() => setConfirm(null)} />

      {exportingPlan ? <ExportSheet ref={sheetRef} plan={exportingPlan} /> : null}

      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-20 flex justify-center px-4"
      >
        {notice ? (
          <p className="animate-fade-up rounded-lg bg-ink px-3.5 py-2 text-sm font-medium text-canvas shadow-lift">
            {notice}
          </p>
        ) : null}
      </div>
    </div>
  );
}
