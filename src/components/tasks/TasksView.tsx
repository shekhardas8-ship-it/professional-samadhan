// src/components/tasks/TasksView.tsx
import React, { useState } from 'react';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  User,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { INITIAL_ENTERPRISE_TASKS } from '../../services/frontPageDataService.ts';

interface TasksViewProps {
  onBack?: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({ onBack }) => {
  const [tasks, setTasks] = useState<any[]>(() => {
    if (typeof window === 'undefined') return INITIAL_ENTERPRISE_TASKS;
    const saved = localStorage.getItem('ps_enterprise_tasks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return INITIAL_ENTERPRISE_TASKS;
  });

  const persistTasks = (updated: any[]) => {
    setTasks(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ps_enterprise_tasks', JSON.stringify(updated));
      window.dispatchEvent(new Event('ps_data_updated'));
    }
  };

  React.useEffect(() => {
    const handleSync = () => {
      const saved = localStorage.getItem('ps_enterprise_tasks');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setTasks(parsed);
        } catch {}
      }
    };
    window.addEventListener('ps_data_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('ps_data_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const [filterService, setFilterService] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskClient, setNewTaskClient] = useState('Briopox Pvt Ltd');
  const [newTaskService, setNewTaskService] = useState<'GST' | 'TDS' | 'Income Tax' | 'ROC' | 'Audit'>('GST');
  const [newTaskPriority, setNewTaskPriority] = useState<'Urgent' | 'High' | 'Medium' | 'Low'>('High');
  const [newTaskDueDate, setNewTaskDueDate] = useState('2026-10-15');

  const filteredTasks = tasks.filter(t => {
    const matchesService = filterService === 'all' || t.serviceType.toLowerCase() === filterService.toLowerCase();
    const matchesPriority = filterPriority === 'all' || t.priority.toLowerCase() === filterPriority.toLowerCase();
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.executorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesService && matchesPriority && matchesSearch;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask = {
      id: `task_ent_${Date.now()}`,
      clientId: 'cli_briopox_01',
      clientName: newTaskClient,
      clientGstin: '07AABCB9123D1ZX',
      title: newTaskTitle.trim(),
      description: 'Statutory task scheduled via QuinceCA practice manager.',
      serviceType: newTaskService,
      priority: newTaskPriority,
      status: 'Assigned',
      executorName: 'Pooja Verma',
      reviewerName: 'CA Shekhar Das',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: newTaskDueDate,
      timeSpentHours: 0,
      slaHours: 48,
      isOverdue: false,
      checklistItems: [
        { id: 'c1', label: 'Primary source documents received', completed: true },
        { id: 'c2', label: 'Tax computation verified', completed: false },
        { id: 'c3', label: 'Reviewer approval & government portal submission', completed: false },
      ],
    };

    persistTasks([newTask, ...tasks]);
    setNewTaskTitle('');
    setIsNewTaskModalOpen(false);
  };

  const toggleChecklistItem = (taskId: string, checkId: string) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          checklistItems: t.checklistItems.map((c: any) => c.id === checkId ? { ...c, completed: !c.completed } : c),
        };
      }
      return t;
    });
    persistTasks(updated);
  };

  const handleStatusChange = (taskId: string, newStatus: string) => {
    const updated = tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
    persistTasks(updated);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Enterprise Task Management & SLA</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Active Workflow
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track statutory task assignments, checklist milestones, reviewer approvals, and turnaround SLAs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex bg-slate-200 p-0.5 rounded-lg border border-slate-300 text-xs">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md font-semibold transition ${
                viewMode === 'list' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-md font-semibold transition ${
                viewMode === 'kanban' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Kanban Board
            </button>
          </div>

          <button
            onClick={() => setIsNewTaskModalOpen(true)}
            className="px-3.5 py-2 bg-[#00c073] hover:bg-[#00a864] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Total Active Tasks</span>
          <div className="text-2xl font-extrabold text-slate-800 mt-1">{tasks.length}</div>
          <span className="text-[11px] text-emerald-600 font-semibold">100% Assigned</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">In Progress</span>
          <div className="text-2xl font-extrabold text-sky-600 mt-1">
            {tasks.filter(t => t.status === 'In Progress').length}
          </div>
          <span className="text-[11px] text-slate-400">Execution stage</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Under CA Review</span>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">
            {tasks.filter(t => t.status === 'Under Review' || t.status === 'Awaiting Client').length}
          </div>
          <span className="text-[11px] text-amber-600 font-semibold">Review queue</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">SLA Compliance</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">98.4%</div>
          <span className="text-[11px] text-emerald-600 font-semibold">On-time delivery</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by task title, client, or staff..."
            className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Service:</span>
            <select
              value={filterService}
              onChange={e => setFilterService(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-semibold focus:outline-none"
            >
              <option value="all">All Services</option>
              <option value="gst">GST</option>
              <option value="tds">TDS</option>
              <option value="audit">Tax Audit</option>
              <option value="litigation">Litigation / Notices</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>Priority:</span>
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-semibold focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List Mode */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filteredTasks.map(task => (
              <div key={task.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      task.priority === 'Urgent'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : task.priority === 'High'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-blue-100 text-blue-800 border border-blue-300'
                    }`}>
                      {task.priority}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">{task.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Client: <strong className="text-slate-700">{task.clientName}</strong> ({task.clientGstin})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Due: <strong className="text-slate-700">{task.dueDate}</strong>
                    </span>
                    <select
                      value={task.status}
                      onChange={e => handleStatusChange(task.id, e.target.value)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:outline-none ${
                        task.status === 'Approved' || task.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : task.status === 'Under Review'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-blue-50 text-blue-800 border-blue-300'
                      }`}
                    >
                      <option value="Assigned">Assigned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Awaiting Client">Awaiting Client</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Approved">Approved</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  {task.description}
                </p>

                {/* Checklist Milestones */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Milestone Checklist
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {task.checklistItems.map(item => (
                      <label
                        key={item.id}
                        className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer bg-white p-1.5 rounded border border-slate-100 hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => toggleChecklistItem(task.id, item.id)}
                          className="rounded text-[#00c073] focus:ring-0"
                        />
                        <span className={item.completed ? 'line-through text-slate-400' : ''}>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-4">
                    <span>Executor: <strong className="text-slate-600">{task.executorName}</strong></span>
                    <span>Reviewer: <strong className="text-slate-600">{task.reviewerName}</strong></span>
                  </div>
                  <span>Logged: <strong className="text-slate-600">{task.timeSpentHours} hrs</strong> (SLA: {task.slaHours}h)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kanban Mode */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['Assigned', 'In Progress', 'Under Review', 'Approved'].map(col => (
            <div key={col} className="bg-slate-100/70 p-3.5 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-700">{col}</span>
                <span className="text-[10px] bg-white px-2 py-0.5 rounded-full font-bold text-slate-600 border border-slate-200">
                  {tasks.filter(t => t.status === col).length}
                </span>
              </div>

              <div className="space-y-2.5">
                {tasks.filter(t => t.status === col).map(t => (
                  <div key={t.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-slate-500 uppercase">{t.serviceType}</span>
                      <span className="text-[9px] font-bold text-rose-600">{t.priority}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800">{t.title}</h4>
                    <p className="text-[11px] text-slate-500">{t.clientName}</p>
                    <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 flex justify-between">
                      <span>Due: {t.dueDate}</span>
                      <span>{t.executorName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-800">Assign New Practice Task</h3>
              <button onClick={() => setIsNewTaskModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. GSTR-3B Tax Computation & Return Filing"
                  className="w-full p-2.5 border rounded-lg focus:outline-none focus:border-[#00c073]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Client Entity</label>
                  <select
                    value={newTaskClient}
                    onChange={e => setNewTaskClient(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  >
                    <option value="Briopox Pvt Ltd">Briopox Pvt Ltd</option>
                    <option value="Aggarwal & Sons Trading Co.">Aggarwal & Sons Trading Co.</option>
                    <option value="Apex Healthtech LLP">Apex Healthtech LLP</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Service Type</label>
                  <select
                    value={newTaskService}
                    onChange={e => setNewTaskService(e.target.value as any)}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  >
                    <option value="GST">GST</option>
                    <option value="TDS">TDS</option>
                    <option value="Income Tax">Income Tax</option>
                    <option value="ROC">ROC</option>
                    <option value="Audit">Audit</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={e => setNewTaskPriority(e.target.value as any)}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Due Date</label>
                  <input
                    type="date"
                    required
                    value={newTaskDueDate}
                    onChange={e => setNewTaskDueDate(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00c073] hover:bg-[#00a864] text-white rounded-lg font-bold shadow-xs"
                >
                  Create & Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
