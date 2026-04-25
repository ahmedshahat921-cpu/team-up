import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Calendar, User, Flag, GripVertical, X } from 'lucide-react';
import toast from 'react-hot-toast';

const initialTasks = {
  todo: [
    { id: '1', title: 'Design system setup', priority: 'high', assigned: 'Ahmed', due: '2026-04-28' },
    { id: '2', title: 'Database schema', priority: 'medium', assigned: 'Sara', due: '2026-04-29' },
  ],
  in_progress: [
    { id: '3', title: 'Auth API endpoints', priority: 'high', assigned: 'Omar', due: '2026-04-27' },
    { id: '4', title: 'Landing page UI', priority: 'low', assigned: 'Ahmed', due: '2026-04-30' },
  ],
  done: [
    { id: '5', title: 'Project setup', priority: 'medium', assigned: 'All', due: '2026-04-20' },
  ],
};

const columns = [
  { key: 'todo', label: 'To Do', color: 'var(--warning)' },
  { key: 'in_progress', label: 'In Progress', color: 'var(--info)' },
  { key: 'done', label: 'Done', color: 'var(--success)' },
];

const priorityConfig = {
  high: { color: 'var(--danger)', bg: 'rgba(239,68,68,0.15)' },
  medium: { color: 'var(--warning)', bg: 'rgba(245,158,11,0.15)' },
  low: { color: 'var(--success)', bg: 'rgba(34,197,94,0.15)' },
};

export default function TaskBoard() {
  const [tasks, setTasks] = useState(initialTasks);
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragSource, setDragSource] = useState(null);
  const [showNew, setShowNew] = useState(null);
  const [newTask, setNewTask] = useState({ title: '', priority: 'medium', assigned: '', due: '' });

  const handleDragStart = (task, sourceCol) => {
    setDraggedTask(task);
    setDragSource(sourceCol);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.style.background = 'var(--primary-subtle)';
  };

  const handleDragLeave = (e) => {
    e.currentTarget.style.background = '';
  };

  const handleDrop = (targetCol) => {
    if (!draggedTask || dragSource === targetCol) return;
    setTasks(prev => ({
      ...prev,
      [dragSource]: prev[dragSource].filter(t => t.id !== draggedTask.id),
      [targetCol]: [...prev[targetCol], draggedTask],
    }));
    setDraggedTask(null);
    setDragSource(null);
    toast.success(`Task moved to ${targetCol.replace('_', ' ')}`);
  };

  const addTask = (col) => {
    if (!newTask.title.trim()) return;
    const task = { id: Date.now().toString(), ...newTask };
    setTasks(prev => ({ ...prev, [col]: [...prev[col], task] }));
    setNewTask({ title: '', priority: 'medium', assigned: '', due: '' });
    setShowNew(null);
    toast.success('Task added!');
  };

  return (
    <div className="page">
      <div className="container">
        <motion.div className="page-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1>📋 Task Board</h1>
          <p>Drag and drop tasks between columns to update their status.</p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, minHeight: '60vh' }}>
          {columns.map(col => (
            <motion.div
              key={col.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => { e.currentTarget.style.background = ''; handleDrop(col.key); }}
            >
              {/* Column Header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                  <h3 style={{ fontSize: '0.95rem' }}>{col.label}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                    {tasks[col.key].length}
                  </span>
                </div>
                <button onClick={() => setShowNew(showNew === col.key ? null : col.key)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                  <Plus size={18} />
                </button>
              </div>

              {/* Tasks */}
              <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {showNew === col.key && (
                  <div className="card" style={{ padding: 12, animation: 'fadeInUp 0.2s ease' }}>
                    <input className="input" placeholder="Task title..." value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})}
                      style={{ marginBottom: 8, width: '100%', fontSize: '0.85rem' }} autoFocus />
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <select className="input" value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})} style={{ flex: 1, fontSize: '0.8rem', padding: '6px 8px' }}>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                      <input type="date" className="input" value={newTask.due} onChange={e => setNewTask({...newTask, due: e.target.value})} style={{ flex: 1, fontSize: '0.8rem', padding: '6px 8px' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-primary btn-sm" onClick={() => addTask(col.key)}>Add</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setShowNew(null)}>Cancel</button>
                    </div>
                  </div>
                )}

                {tasks[col.key].map(task => (
                  <div key={task.id} className="card card-glow"
                    draggable onDragStart={() => handleDragStart(task, col.key)}
                    style={{ padding: 14, cursor: 'grab', transition: 'all 0.2s', userSelect: 'none' }}
                    onMouseDown={e => e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.4)'}
                    onMouseUp={e => e.currentTarget.style.boxShadow = ''}>
                    <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{task.title}</span>
                      <GripVertical size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-full)',
                        color: priorityConfig[task.priority].color, background: priorityConfig[task.priority].bg
                      }}>
                        {task.priority}
                      </span>
                      {task.assigned && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <User size={12} /> {task.assigned}
                        </span>
                      )}
                      {task.due && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={12} /> {new Date(task.due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
