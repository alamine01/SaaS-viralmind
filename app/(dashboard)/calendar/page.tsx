"use client"

import { useState, useEffect } from "react"
import { 
  Plus, 
  X, 
  Sparkles, 
  Trash2, 
  Edit3, 
  Calendar as CalendarIcon,
  Video,
  Clock,
  AlertCircle,
  MoreVertical,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Lightbulb
} from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useWorkspace } from "@/lib/workspace-context"

// Dnd-kit imports
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay,
  useDroppable
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Define types
type TaskStatus = 'ideas' | 'writing' | 'filming' | 'published';
type TaskPriority = 'low' | 'medium' | 'high';
type TaskPlatform = 'tiktok' | 'youtube' | 'instagram' | 'other';

interface CalendarTask {
  id: string
  title: string
  description?: string
  platform: TaskPlatform
  status: TaskStatus
  priority: TaskPriority
  label_color: string
  scheduled_date?: string
  position: number
  collection_name: string
  created_at: string
}

// Columns definition
const COLUMNS: { id: TaskStatus; title: string; color: string; bg: string; border: string }[] = [
  { id: 'ideas', title: 'Idées', color: 'text-amber-600', bg: 'bg-amber-50/50', border: 'border-amber-100/50' },
  { id: 'writing', title: 'En Rédaction', color: 'text-indigo-600', bg: 'bg-indigo-50/50', border: 'border-indigo-100/50' },
  { id: 'filming', title: 'À Filmer', color: 'text-rose-600', bg: 'bg-rose-50/50', border: 'border-rose-100/50' },
  { id: 'published', title: 'Publié', color: 'text-emerald-600', bg: 'bg-emerald-50/50', border: 'border-emerald-100/50' }
];

// Column Header Icons Selector
const ColumnHeaderIcon = ({ id, className = "size-4" }: { id: TaskStatus; className?: string }) => {
  switch (id) {
    case 'ideas':
      return <Lightbulb className={`${className} text-amber-600`} />;
    case 'writing':
      return <Edit3 className={`${className} text-indigo-600`} />;
    case 'filming':
      return <Video className={`${className} text-rose-600`} />;
    case 'published':
      return <CheckCircle2 className={`${className} text-emerald-600`} />;
  }
};

// Helper to format date
const formatDate = (dateStr?: string) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

// Inline SVG brand icons
const InstagramIcon = ({ className = "size-3.5" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const YoutubeIcon = ({ className = "size-3.5" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3v6Z" />
  </svg>
);

// Platform Icons Selector
const PlatformIcon = ({ platform, className = "size-3.5" }: { platform: TaskPlatform; className?: string }) => {
  switch (platform) {
    case "tiktok":
      return <Video className={`${className} text-rose-500`} />;
    case "instagram":
      return <InstagramIcon className={`${className} text-pink-500`} />;
    case "youtube":
      return <YoutubeIcon className={`${className} text-red-500`} />;
    default:
      return <Sparkles className={`${className} text-indigo-500`} />;
  }
};

// --- Sortable Item Component ---
function SortableCard({ task, onEdit, onDelete }: { task: CalendarTask; onEdit: () => void; onDelete: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const priorityColor = {
    low: 'bg-blue-50 text-blue-600 border-blue-100',
    medium: 'bg-amber-50 text-amber-600 border-amber-100',
    high: 'bg-rose-50 text-rose-600 border-rose-100'
  }[task.priority || 'medium'];

  const priorityLabels = {
    low: 'Basse',
    medium: 'Moyenne',
    high: 'Haute'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-white rounded-2xl border border-slate-100/80 p-3.5 hover:border-slate-200/80 hover:shadow-lg hover:shadow-slate-100/40 transition-all select-none relative duration-200`}
    >
      {/* Drag handle button or mouse listeners */}
      <div 
        {...attributes} 
        {...listeners} 
        className="absolute top-3 left-3 right-12 h-5 cursor-grab active:cursor-grabbing"
      />

      <div className="flex flex-col gap-2">
        {/* Top Indicators */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 pointer-events-none">
          <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border ${priorityColor} shrink-0`}>
            {priorityLabels[task.priority]}
          </span>
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-100/50 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 capitalize shrink-0 max-w-full overflow-hidden">
            <PlatformIcon platform={task.platform} className="size-3 shrink-0" />
            <span className="truncate max-w-[85px]">{task.platform === 'other' ? 'Autre' : task.platform}</span>
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <h4 className="text-[13px] font-black text-slate-900 leading-snug tracking-tight pr-6">
            {task.title}
          </h4>
          {task.description && (
            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        {/* Footer info (date & actions) */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-50 pt-2 mt-0.5">
          <div className="flex items-center gap-1 text-slate-400 shrink-0">
            <CalendarIcon className="size-3 shrink-0" />
            <span className="text-[10px] font-bold truncate max-w-[90px]">
              {task.scheduled_date ? formatDate(task.scheduled_date) : "Non planifié"}
            </span>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1 hover:bg-slate-50 rounded-md text-slate-400 hover:text-slate-900 transition-colors"
              title="Modifier"
            >
              <Edit3 className="size-3.5" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1 hover:bg-rose-50 rounded-md text-slate-400 hover:text-rose-600 transition-colors"
              title="Supprimer"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Static Preview Card for DragOverlay ---
function PreviewCard({ task }: { task: CalendarTask }) {
  const priorityColor = {
    low: 'bg-blue-50 text-blue-600 border-blue-100',
    medium: 'bg-amber-50 text-amber-600 border-amber-100',
    high: 'bg-rose-50 text-rose-600 border-rose-100'
  }[task.priority || 'medium'];

  const priorityLabels = {
    low: 'Basse',
    medium: 'Moyenne',
    high: 'Haute'
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-3.5 select-none w-[320px] pointer-events-none scale-105 rotate-1">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border ${priorityColor} shrink-0`}>
            {priorityLabels[task.priority]}
          </span>
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 capitalize shrink-0 max-w-full overflow-hidden">
            <PlatformIcon platform={task.platform} className="size-3 shrink-0" />
            <span className="truncate max-w-[85px]">{task.platform === 'other' ? 'Autre' : task.platform}</span>
          </div>
        </div>
        <div>
          <h4 className="text-[13px] font-black text-slate-900 leading-snug tracking-tight">{task.title}</h4>
          {task.description && <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{task.description}</p>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-50 pt-2">
          <div className="flex items-center gap-1 text-slate-400 shrink-0">
            <CalendarIcon className="size-3 shrink-0" />
            <span className="text-[10px] font-bold truncate max-w-[90px]">
              {task.scheduled_date ? formatDate(task.scheduled_date) : "Non planifié"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Droppable Column Wrapper ---
function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`flex-1 flex flex-col min-h-0 transition-colors duration-200 rounded-2xl ${isOver ? 'bg-indigo-50/40' : ''}`}>
      {children}
    </div>
  );
}

// --- Main Page Component ---
export default function CalendarPage() {
  const { activeCollection } = useWorkspace()
  const [tasks, setTasks] = useState<CalendarTask[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<CalendarTask | null>(null)
  const [modalStatus, setModalStatus] = useState<TaskStatus>('ideas')

  // Form Fields
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [platform, setPlatform] = useState<TaskPlatform>("other")
  const [priority, setPriority] = useState<TaskPriority>("medium")
  const [scheduledDate, setScheduledDate] = useState("")

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Avoid dragging on simple clicks
      },
    })
  );

  // Fetch tasks when active workspace collection changes
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/calendar?collection=${activeCollection}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTasks(data);
    } catch (e: any) {
      console.error(e.message);
      toast.error("Impossible de récupérer les tâches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [activeCollection]);

  // Open modal for creating a task in a specific column
  const handleOpenCreateModal = (status: TaskStatus) => {
    setEditingTask(null);
    setModalStatus(status);
    setTitle("");
    setDescription("");
    setPlatform("other");
    setPriority("medium");
    setScheduledDate("");
    setIsModalOpen(true);
  };

  // Open modal for editing a task
  const handleOpenEditModal = (task: CalendarTask) => {
    setEditingTask(task);
    setModalStatus(task.status);
    setTitle(task.title);
    setDescription(task.description || "");
    setPlatform(task.platform);
    setPriority(task.priority);
    setScheduledDate(task.scheduled_date || "");
    setIsModalOpen(true);
  };

  // Save / Update Task handler
  const handleSaveTask = async () => {
    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      platform,
      priority,
      scheduled_date: scheduledDate || null,
      status: modalStatus,
      collection_name: activeCollection
    };

    try {
      if (editingTask) {
        // Update task
        const res = await fetch('/api/calendar', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingTask.id, ...payload })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        
        setTasks(prev => prev.map(t => t.id === editingTask.id ? data : t));
        toast.success("Carte mise à jour !");
      } else {
        // Create new task
        const res = await fetch('/api/calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        setTasks(prev => [...prev, data]);
        toast.success("Tâche ajoutée au calendrier !");
      }
      setIsModalOpen(false);
    } catch (e: any) {
      toast.error(`Erreur: ${e.message}`);
    }
  };

  // Delete task handler
  const handleDeleteTask = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette tâche ?")) return;

    try {
      const res = await fetch(`/api/calendar?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setTasks(prev => prev.filter(t => t.id !== id));
      toast.success("Tâche supprimée");
    } catch (e: any) {
      toast.error(`Erreur: ${e.message}`);
    }
  };

  // --- Dnd Kit drag events handlers ---
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Helper to find which column a task or column id belongs to
  const findColumnForId = (id: string): TaskStatus | null => {
    const columnsIds = COLUMNS.map(c => c.id);
    if (columnsIds.includes(id as TaskStatus)) return id as TaskStatus;
    const task = tasks.find(t => t.id === id);
    return task ? task.status : null;
  };

  // onDragOver: handles cross-column movement in real-time
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumn = findColumnForId(activeId);
    const overColumn = findColumnForId(overId);

    if (!activeColumn || !overColumn || activeColumn === overColumn) return;

    // Move the task to the new column optimistically
    setTasks(prev => {
      const activeTask = prev.find(t => t.id === activeId);
      if (!activeTask) return prev;

      // Get tasks in the target column (excluding the active task)
      const overColTasks = prev
        .filter(t => t.status === overColumn && t.id !== activeId)
        .sort((a, b) => a.position - b.position);

      // Find insertion index
      let insertIdx = overColTasks.length; // default: end
      const overTask = prev.find(t => t.id === overId);
      if (overTask) {
        const overIdx = overColTasks.findIndex(t => t.id === overId);
        if (overIdx >= 0) insertIdx = overIdx;
      }

      // Build new state
      const otherTasks = prev.filter(t => t.id !== activeId && t.status !== overColumn);
      const updatedActive = { ...activeTask, status: overColumn };
      overColTasks.splice(insertIdx, 0, updatedActive);
      const reindexed = overColTasks.map((t, idx) => ({ ...t, position: idx }));

      // Also reindex the source column
      const sourceColTasks = prev
        .filter(t => t.status === activeColumn && t.id !== activeId)
        .sort((a, b) => a.position - b.position)
        .map((t, idx) => ({ ...t, position: idx }));

      return [...otherTasks.filter(t => t.status !== activeColumn), ...sourceColTasks, ...reindexed];
    });
  };

  // onDragEnd: handles reordering within same column + DB persistence
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find(t => t.id === activeTaskId);
    if (!activeTask) return;

    const targetStatus = activeTask.status;
    const columnsIds = COLUMNS.map(c => c.id);

    // Determine target index
    let targetIndex = 0;
    if (columnsIds.includes(overId as TaskStatus)) {
      // Dropped on the column itself, place at end
      const colTasks = tasks.filter(t => t.status === overId as TaskStatus && t.id !== activeTaskId);
      targetIndex = colTasks.length;
    } else {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask && overTask.status === targetStatus) {
        const colTasks = tasks
          .filter(t => t.status === targetStatus && t.id !== activeTaskId)
          .sort((a, b) => a.position - b.position);
        const overIdx = colTasks.findIndex(t => t.id === overId);
        targetIndex = overIdx >= 0 ? overIdx : colTasks.length;
      }
    }

    // Final optimistic reorder
    const originalTasksState = [...tasks];
    const cleanTasks = tasks.filter(t => t.id !== activeTaskId);
    const otherTasks = cleanTasks.filter(t => t.status !== targetStatus);
    const targetColTasks = cleanTasks
      .filter(t => t.status === targetStatus)
      .sort((a, b) => a.position - b.position);

    const updatedActiveTask = { ...activeTask, status: targetStatus };
    targetColTasks.splice(targetIndex, 0, updatedActiveTask);
    const recalculatedTargetCol = targetColTasks.map((t, idx) => ({ ...t, position: idx }));
    const newTasksState = [...otherTasks, ...recalculatedTargetCol];
    setTasks(newTasksState);

    // Persist to DB
    const bulkUpdates = recalculatedTargetCol.map(t => ({
      id: t.id,
      status: t.status,
      position: t.position
    }));

    try {
      const res = await fetch('/api/calendar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: bulkUpdates })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
    } catch (dbError) {
      console.error("Dnd save failed, reverting:", dbError);
      setTasks(originalTasksState);
      toast.error("Erreur de synchronisation, repositionnement annulé");
    }
  };

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  return (
    <div className="space-y-10 py-6 max-w-[1550px] mx-auto px-4 md:px-6 font-sans antialiased text-slate-900">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Calendrier Éditorial
          </h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1.5 flex items-center gap-2">
            <span>Workflow Kanban</span>
            <ChevronRight className="size-3 text-slate-300" />
            <span className="text-indigo-600">Drag & Drop</span>
          </p>
        </div>
        <button
          onClick={() => handleOpenCreateModal('ideas')}
          className="px-6 py-4 bg-slate-900 text-white hover:bg-indigo-600 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="size-4" /> Nouvelle Carte
        </button>
      </div>

      {/* Loader */}
      {loading ? (
        <div className="flex xl:grid xl:grid-cols-4 gap-6 overflow-x-auto pb-4 -mx-4 px-4 xl:mx-0 xl:px-0 scrollbar-thin">
          {COLUMNS.map((col) => (
            <div key={col.id} className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100/50 space-y-4 h-[530px] shrink-0 w-[310px] sm:w-[340px] xl:w-full">
              <div className="h-6 bg-slate-200 rounded-full w-24 animate-pulse" />
              <div className="h-28 bg-white rounded-2xl border border-slate-100 animate-pulse" />
              <div className="h-28 bg-white rounded-2xl border border-slate-100 animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        /* DndContext Board */
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex xl:grid xl:grid-cols-4 gap-6 items-start overflow-x-auto pb-6 scrollbar-thin -mx-4 px-4 xl:mx-0 xl:px-0">
            {COLUMNS.map((column) => {
              const colTasks = tasks
                .filter(t => t.status === column.id)
                .sort((a, b) => a.position - b.position);

              return (
                <div 
                  key={column.id} 
                  className={`rounded-3xl p-6 border ${column.border} ${column.bg} transition-all duration-300 h-[530px] flex flex-col shrink-0 w-[310px] sm:w-[340px] xl:w-full`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-5 select-none">
                    <div className="flex items-center gap-2">
                      <ColumnHeaderIcon id={column.id} className="size-4 shrink-0" />
                      <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-wider">
                        {column.title}
                      </h3>
                      <span className="text-[10px] bg-white border border-slate-200/50 text-slate-400 font-extrabold px-2.5 py-0.5 rounded-full shadow-xs">
                        {colTasks.length}
                      </span>
                    </div>
                    
                    <button 
                      onClick={() => handleOpenCreateModal(column.id)}
                      className="p-1.5 bg-white border border-slate-200/50 text-slate-400 hover:text-slate-900 rounded-lg hover:shadow-xs transition-all"
                      title={`Ajouter dans ${column.title}`}
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>

                  {/* Drop zone inside Column container */}
                  <SortableContext items={colTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    <DroppableColumn id={column.id}>
                      <div className="space-y-4 flex-1 overflow-y-auto pr-1.5 pb-4 scrollbar-thin min-h-[150px]">
                        {colTasks.map((task) => (
                          <SortableCard
                            key={task.id}
                            task={task}
                            onEdit={() => handleOpenEditModal(task)}
                            onDelete={() => handleDeleteTask(task.id)}
                          />
                        ))}

                        {/* Fallback empty view placeholder */}
                        {colTasks.length === 0 && (
                          <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-200/60 rounded-2xl py-10 px-4 bg-white/50 text-center select-none">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                              Déposer ici
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                              Aucune carte planifiée
                            </p>
                          </div>
                        )}
                      </div>
                    </DroppableColumn>
                  </SortableContext>
                </div>
              );
            })}
          </div>

          {/* Drag Overlay to render ghost card during drag */}
          <DragOverlay adjustScale={false}>
            {activeTask ? (
              <PreviewCard task={activeTask} />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* --- CREATE / EDIT DIALOG --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <CalendarIcon className="size-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {editingTask ? "Modifier la Carte" : "Nouvelle Carte Éditoriale"}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="size-6 text-slate-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-10 space-y-6 max-h-[60vh] overflow-y-auto">
              
              {/* Title field */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Titre du contenu</label>
                <input 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: 5 astuces secrètes pour percer sur TikTok..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 outline-hidden transition-all text-slate-800"
                  autoFocus
                />
              </div>

              {/* Description field */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description / notes</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Écrivez le concept, les hooks ou des idées visuelles de la vidéo..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 outline-hidden transition-all text-slate-800 resize-none"
                />
              </div>

              {/* Select layout */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Platform */}
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plateforme</label>
                  <select 
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as TaskPlatform)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white outline-hidden transition-all cursor-pointer text-slate-700"
                  >
                    <option value="tiktok">TikTok</option>
                    <option value="instagram">Instagram Reels</option>
                    <option value="youtube">YouTube Shorts</option>
                    <option value="other">Autre format</option>
                  </select>
                </div>

                {/* Priority */}
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priorité</label>
                  <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white outline-hidden transition-all cursor-pointer text-slate-700"
                  >
                    <option value="low">Priorité Basse</option>
                    <option value="medium">Priorité Moyenne</option>
                    <option value="high">Priorité Haute</option>
                  </select>
                </div>

              </div>

              {/* Status and Scheduled Date grid */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Status Column */}
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Étape / Status</label>
                  <select 
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value as TaskStatus)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white outline-hidden transition-all cursor-pointer text-slate-700"
                  >
                    {COLUMNS.map(col => (
                      <option key={col.id} value={col.id}>{col.title}</option>
                    ))}
                  </select>
                </div>

                {/* Scheduled Date */}
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date de publication</label>
                  <input 
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white outline-hidden transition-all text-slate-700"
                  />
                </div>

              </div>

            </div>

            {/* Modal Footer actions */}
            <div className="p-8 bg-slate-50 border-t border-slate-50 flex gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={handleSaveTask}
                className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-600 disabled:opacity-50 transition-all shadow-xl shadow-slate-200"
              >
                {editingTask ? "Sauvegarder" : "Créer la Carte"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
