import React, { useState } from 'react';

import { extractApiErrorMessage } from '@/lib/api-client';

import { useBrands } from '../../garage/hooks/useBrands';
import { useModels } from '../../garage/hooks/useModels';
import { useMaintenanceGuides } from '../hooks/useMaintenanceTasks';
import { maintenanceApi } from '../server/maintenance.api';

import { CreateGuideModal } from './CreateGuideModal';
import { CreateTaskModal } from './CreateTaskModal';
import { MaintenanceFilters } from './MaintenanceFilters';
import { MaintenanceGuidesList } from './MaintenanceGuidesList';
import { MaintenanceHeader } from './MaintenanceHeader';

import type {
  CreateMaintenanceGuideDto,
  CreateMaintenanceTaskDto,
  MaintenanceGuideResponse,
} from '@kore/shared';

export function MaintenanceCreatePage(): JSX.Element {
  const { brands } = useBrands();
  const [brandId, setBrandId] = useState<number | null>(null);
  const [modelId, setModelId] = useState<number | null>(null);
  const { models } = useModels(brandId);
  const { tasks: guides, loading } = useMaintenanceGuides(
    brandId === null ? undefined : brandId,
    modelId === null ? undefined : modelId,
  );

  const [displayedGuides, setDisplayedGuides] = useState<MaintenanceGuideResponse[]>([]);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);

  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [newGuideDescription, setNewGuideDescription] = useState('');
  const [guideFormError, setGuideFormError] = useState<string | null>(null);
  const [savingGuide, setSavingGuide] = useState(false);
  const [newGuideBrandId, setNewGuideBrandId] = useState<number | null>(null);
  const { models: modalModels } = useModels(newGuideBrandId);
  const [newGuideModelId, setNewGuideModelId] = useState<number | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedGuideId, setSelectedGuideId] = useState<number | null>(null);
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskMileage, setNewTaskMileage] = useState('10000');
  const [newTaskMonths, setNewTaskMonths] = useState('');
  const [newTaskIsCritical, setNewTaskIsCritical] = useState(false);
  const [taskFormError, setTaskFormError] = useState<string | null>(null);
  const [savingTask, setSavingTask] = useState(false);

  React.useEffect(() => {
    setDisplayedGuides(guides);
  }, [guides]);

  function toggleGuide(id: number) {
    setExpandedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function resetGuideForm() {
    setNewGuideDescription('');
    setGuideFormError(null);
    setNewGuideBrandId(null);
    setNewGuideModelId(null);
  }

  function openGuideModal() {
    resetGuideForm();
    setIsGuideModalOpen(true);
  }

  async function handleCreateGuide() {
    const targetModelId = newGuideModelId ?? modelId;
    if (!targetModelId) {
      setGuideFormError('Selecciona un modelo antes de crear una guía.');
      return;
    }

    const payload: CreateMaintenanceGuideDto = {
      modelId: targetModelId,
      description: newGuideDescription.trim() || 'Guía sin título',
    };

    setSavingGuide(true);
    setGuideFormError(null);

    try {
      const guide = await maintenanceApi.createGuide(payload);
      setDisplayedGuides((prev) => [guide, ...prev]);
      setExpandedIds((prev) => [guide.id, ...prev]);
      setIsGuideModalOpen(false);
      resetGuideForm();
    } catch (error) {
      setGuideFormError(extractApiErrorMessage(error));
    } finally {
      setSavingGuide(false);
    }
  }

  function resetTaskForm() {
    setNewTaskDescription('');
    setNewTaskMileage('10000');
    setNewTaskMonths('');
    setNewTaskIsCritical(false);
    setTaskFormError(null);
  }

  function openTaskModal(guideId: number) {
    setSelectedGuideId(guideId);
    resetTaskForm();
    setIsTaskModalOpen(true);
  }

  async function handleCreateTask() {
    if (!selectedGuideId) {
      setTaskFormError('Selecciona primero la guía destino.');
      return;
    }

    if (!newTaskDescription.trim()) {
      setTaskFormError('La descripción de la tarea es obligatoria.');
      return;
    }

    const mileage = Number(newTaskMileage);
    if (!newTaskMileage || Number.isNaN(mileage) || mileage <= 0) {
      setTaskFormError('El intervalo de kilometraje debe ser un número mayor a 0.');
      return;
    }

    let monthInterval: number | undefined;
    if (newTaskMonths.trim()) {
      const parsedMonths = Number(newTaskMonths);
      if (Number.isNaN(parsedMonths) || parsedMonths < 0) {
        setTaskFormError('El intervalo de meses debe ser un número válido o dejarse vacío.');
        return;
      }
      monthInterval = parsedMonths;
    }

    const payload: CreateMaintenanceTaskDto = {
      description: newTaskDescription.trim(),
      mileageInterval: mileage,
      monthInterval,
      isCritical: newTaskIsCritical,
    };

    setSavingTask(true);
    setTaskFormError(null);

    try {
      const task = await maintenanceApi.createTask(selectedGuideId, payload);
      setDisplayedGuides((prev) =>
        prev.map((guide) =>
          guide.id === selectedGuideId ? { ...guide, tasks: [...guide.tasks, task] } : guide,
        ),
      );
      setExpandedIds((prev) =>
        prev.includes(selectedGuideId) ? prev : [...prev, selectedGuideId],
      );
      setIsTaskModalOpen(false);
      resetTaskForm();
    } catch (error) {
      setTaskFormError(extractApiErrorMessage(error));
    } finally {
      setSavingTask(false);
    }
  }

  function handleBrandChange(value: string) {
    const nextBrandId = value ? Number(value) : null;
    setBrandId(Number.isNaN(nextBrandId) ? null : nextBrandId);
    setModelId(null);
  }

  function handleModelChange(value: string) {
    const nextModelId = value ? Number(value) : null;
    setModelId(Number.isNaN(nextModelId) ? null : nextModelId);
  }

  const selectedGuide = displayedGuides.find((guide) => guide.id === selectedGuideId);

  return (
    <div className="relative mx-auto max-w-7xl px-8 py-12 animate-fade-in-up">
      <div className="mb-8 flex flex-col gap-6">
        <MaintenanceHeader onOpenGuideModal={openGuideModal} />
        <MaintenanceFilters
          brands={brands}
          models={models}
          brandId={brandId}
          modelId={modelId}
          onBrandChange={handleBrandChange}
          onModelChange={handleModelChange}
        />
      </div>

      <MaintenanceGuidesList
        guides={displayedGuides}
        loading={loading}
        expandedIds={expandedIds}
        onToggleGuide={toggleGuide}
        onOpenTaskModal={openTaskModal}
      />

      <button
        type="button"
        className="fixed bottom-8 right-8 z-20 inline-flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-700 shadow-2xl shadow-slate-900/10 ring-1 ring-slate-200"
        aria-label="Ayuda"
      >
        ?
      </button>

      <CreateGuideModal
        open={isGuideModalOpen}
        onOpenChange={(open) => {
          if (!open) resetGuideForm();
          setIsGuideModalOpen(open);
        }}
        brands={brands}
        modalModels={modalModels}
        newGuideBrandId={newGuideBrandId}
        newGuideModelId={newGuideModelId}
        newGuideDescription={newGuideDescription}
        guideFormError={guideFormError}
        savingGuide={savingGuide}
        onBrandChange={(value) => {
          const next = value ? Number(value) : null;
          setNewGuideBrandId(Number.isNaN(next) ? null : next);
          setNewGuideModelId(null);
        }}
        onModelChange={(value) => setNewGuideModelId(value ? Number(value) : null)}
        onDescriptionChange={setNewGuideDescription}
        onSubmit={() => void handleCreateGuide()}
      />

      <CreateTaskModal
        open={isTaskModalOpen}
        onOpenChange={(open) => {
          if (!open) resetTaskForm();
          setIsTaskModalOpen(open);
        }}
        selectedGuide={selectedGuide}
        newTaskDescription={newTaskDescription}
        newTaskMileage={newTaskMileage}
        newTaskMonths={newTaskMonths}
        newTaskIsCritical={newTaskIsCritical}
        taskFormError={taskFormError}
        savingTask={savingTask}
        onDescriptionChange={setNewTaskDescription}
        onMileageChange={setNewTaskMileage}
        onMonthsChange={setNewTaskMonths}
        onIsCriticalChange={setNewTaskIsCritical}
        onSubmit={() => void handleCreateTask()}
      />
    </div>
  );
}
