'use client';

import { useEffect, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Exercise, Workout, WorkoutExercise, WorkoutSplitType } from '@movvo/shared';
import { workoutsApi } from '@/modules/workouts/services/workoutsApi';
import { AlunoSelect } from '@/modules/alunos/components/AlunoSelect';
import { SplitPicker } from './SplitPicker';
import { SignWorkoutBar } from './SignWorkoutBar';

type DraftRow = {
  key: string;
  exerciseId: string;
  name: string;
  sets: number;
  repetitions: string;
  load: string;
  restSeconds: number;
  rpe: string;
  dayLabel: string;
  cadence: string;
  existingId?: string;
};

function SortableRow({
  row,
  onChange,
  onDuplicate,
  onRemove,
}: {
  row: DraftRow;
  onChange: (key: string, patch: Partial<DraftRow>) => void;
  onDuplicate: (key: string) => void;
  onRemove: (key: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: row.key,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex flex-wrap items-center gap-2 rounded border border-[var(--border)] bg-[var(--surface)] p-2"
      data-testid={`builder-row-${row.key}`}
    >
      <button
        type="button"
        className="cursor-grab px-1 text-[var(--muted)]"
        {...attributes}
        {...listeners}
        aria-label="Arrastar"
      >
        ⋮⋮
      </button>
      <span className="min-w-[8rem] flex-1 text-sm font-medium">{row.name}</span>
      <input
        className="movvo-input w-16"
        type="number"
        min={1}
        value={row.sets}
        onChange={(e) => onChange(row.key, { sets: Number(e.target.value) })}
        title="Séries"
      />
      <input
        className="movvo-input w-20"
        value={row.repetitions}
        onChange={(e) => onChange(row.key, { repetitions: e.target.value })}
        title="Repetições"
      />
      <input
        className="movvo-input w-20"
        value={row.load}
        onChange={(e) => onChange(row.key, { load: e.target.value })}
        placeholder="Carga"
      />
      <input
        className="movvo-input w-16"
        type="number"
        value={row.restSeconds}
        onChange={(e) => onChange(row.key, { restSeconds: Number(e.target.value) })}
        title="Descanso"
      />
      <input
        className="movvo-input w-16"
        value={row.rpe}
        onChange={(e) => onChange(row.key, { rpe: e.target.value })}
        placeholder="RPE"
      />
      <input
        className="movvo-input w-16"
        value={row.dayLabel}
        onChange={(e) => onChange(row.key, { dayLabel: e.target.value })}
        placeholder="Dia"
      />
      <input
        className="movvo-input w-20"
        value={row.cadence}
        onChange={(e) => onChange(row.key, { cadence: e.target.value })}
        placeholder="Cadência"
      />
      <button type="button" className="movvo-btn movvo-btn-ghost text-xs" onClick={() => onDuplicate(row.key)}>
        Dup
      </button>
      <button type="button" className="movvo-btn movvo-btn-ghost text-xs" onClick={() => onRemove(row.key)}>
        Rem
      </button>
    </li>
  );
}

function toDraft(ex: WorkoutExercise, name: string): DraftRow {
  return {
    key: ex.id,
    existingId: ex.id,
    exerciseId: ex.exerciseId,
    name,
    sets: ex.sets,
    repetitions: ex.repetitions,
    load: ex.load || '',
    restSeconds: ex.restSeconds,
    rpe: ex.rpe != null ? String(ex.rpe) : '',
    dayLabel: ex.dayLabel || '',
    cadence: ex.cadence || ex.tempo || '',
  };
}

export function WorkoutBuilder({
  accessToken,
  workoutId,
}: {
  accessToken: string;
  workoutId?: string;
}) {
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('Novo treino');
  const [splitType, setSplitType] = useState<WorkoutSplitType>('ABC');
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    workoutsApi
      .exercises(accessToken)
      .then(setLibrary)
      .catch((e) => setError(e instanceof Error ? e.message : 'erro'));
  }, [accessToken]);

  useEffect(() => {
    if (!workoutId) return;
    workoutsApi
      .getWorkout(accessToken, workoutId)
      .then((w) => {
        setWorkout(w);
        setStudentId(w.studentId);
        setName(w.name);
        setSplitType((w.splitType as WorkoutSplitType) || 'custom');
        const nameMap = new Map(library.map((e) => [e.id, e.name]));
        setRows((w.exercises || []).map((ex) => toDraft(ex, nameMap.get(ex.exerciseId) || ex.exerciseId)));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'erro'));
  }, [accessToken, workoutId, library]);

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setRows((items) => {
      const oldIndex = items.findIndex((i) => i.key === active.id);
      const newIndex = items.findIndex((i) => i.key === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  }

  function addExercise(ex: Exercise) {
    setRows((prev) => [
      ...prev,
      {
        key: `new-${ex.id}-${Date.now()}`,
        exerciseId: ex.id,
        name: ex.name,
        sets: 3,
        repetitions: '10',
        load: '',
        restSeconds: 60,
        rpe: '7',
        dayLabel: 'A',
        cadence: '',
      },
    ]);
  }

  async function save(publish = false) {
    setError(null);
    setMsg(null);
    if (!studentId) {
      setError('Selecione um aluno');
      return;
    }
    const exercises = rows.map((r, i) => ({
      exerciseId: r.exerciseId,
      sortOrder: i + 1,
      sets: r.sets,
      repetitions: r.repetitions,
      load: r.load || undefined,
      restSeconds: r.restSeconds,
      rpe: r.rpe ? Number(r.rpe) : undefined,
      dayLabel: r.dayLabel || undefined,
      cadence: r.cadence || undefined,
    }));
    try {
      let w: Workout;
      if (workout?.id) {
        w = await workoutsApi.updateWorkout(accessToken, workout.id, {
          name,
          splitType,
          exercises,
          status: publish ? 'published' : undefined,
        });
        if (rows.length) {
          await workoutsApi.reorderExercises(
            accessToken,
            workout.id,
            (w.exercises || []).map((e) => e.id),
          );
        }
      } else {
        w = await workoutsApi.createWorkout(accessToken, {
          studentId,
          name,
          splitType,
          exercises,
          publish,
        });
      }
      setWorkout(w);
      setMsg(publish ? 'Treino publicado' : 'Treino salvo');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro');
    }
  }

  return (
    <div className="space-y-6" data-testid="workout-builder">
      <div className="flex flex-wrap items-end gap-3">
        <AlunoSelect accessToken={accessToken} value={studentId} onChange={setStudentId} />
        <label className="text-sm text-[var(--muted)]">
          Nome
          <input
            className="mt-1 block movvo-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid="workout-name"
          />
        </label>
        <SplitPicker value={splitType} onChange={setSplitType} />
        <button type="button" className="movvo-btn" onClick={() => save(false)} data-testid="workout-save">
          Salvar
        </button>
        <button
          type="button"
          className="movvo-btn movvo-btn-primary"
          onClick={() => save(true)}
          data-testid="workout-publish"
        >
          Publicar
        </button>
      </div>

      {workout ? <SignWorkoutBar accessToken={accessToken} workout={workout} onSigned={setWorkout} /> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold">Biblioteca</h3>
          <ul className="max-h-80 space-y-1 overflow-auto text-sm">
            {library.map((ex) => (
              <li key={ex.id} className="flex justify-between gap-2">
                <span>{ex.name}</span>
                <button
                  type="button"
                  className="movvo-btn movvo-btn-ghost text-xs"
                  onClick={() => addExercise(ex)}
                  data-testid={`add-ex-${ex.id}`}
                >
                  +
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">Prescrição (arraste para reordenar)</h3>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={rows.map((r) => r.key)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-2">
                {rows.map((row) => (
                  <SortableRow
                    key={row.key}
                    row={row}
                    onChange={(key, patch) =>
                      setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
                    }
                    onDuplicate={(key) => {
                      const src = rows.find((r) => r.key === key);
                      if (!src) return;
                      setRows((prev) => [
                        ...prev,
                        { ...src, key: `dup-${Date.now()}`, existingId: undefined },
                      ]);
                    }}
                    onRemove={(key) => setRows((prev) => prev.filter((r) => r.key !== key))}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {msg ? <p className="text-sm text-[var(--muted)]">{msg}</p> : null}
    </div>
  );
}
