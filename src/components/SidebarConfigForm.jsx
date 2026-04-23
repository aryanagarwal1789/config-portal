import { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
    arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './forms.css';
import './NavbarItemsList.css';

function SortableSidebarItem({ item, idx, expanded, onToggleExpand, onChange }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: item.id
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 'auto'
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`nav-item-card ${isDragging ? 'is-dragging' : ''} ${!item.isVisible ? 'is-disabled' : ''}`}
        >
            <div className="nav-item-summary">
                <span className="drag-handle" {...attributes} {...listeners} title="Drag to reorder">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="4" cy="3" r="1.2" fill="currentColor"/>
                        <circle cx="10" cy="3" r="1.2" fill="currentColor"/>
                        <circle cx="4" cy="7" r="1.2" fill="currentColor"/>
                        <circle cx="10" cy="7" r="1.2" fill="currentColor"/>
                        <circle cx="4" cy="11" r="1.2" fill="currentColor"/>
                        <circle cx="10" cy="11" r="1.2" fill="currentColor"/>
                    </svg>
                </span>

                <div className="nav-item-label-wrap">
                    <span className={`nav-item-label ${!item.isVisible ? 'label-muted' : ''}`}>
                        {item.label || <em className="placeholder">Untitled</em>}
                    </span>
                    <span className={`nav-item-status ${item.isVisible ? 'status-on' : 'status-off'}`}>
                        {item.isVisible ? 'Visible in sidebar' : 'Hidden from sidebar'}
                    </span>
                </div>

                <label className="toggle-switch" title={item.isVisible ? 'Enabled — click to disable' : 'Disabled — click to enable'}>
                    <input
                        type="checkbox"
                        checked={item.isVisible}
                        onChange={(e) => onChange(idx, 'isVisible', e.target.checked)}
                    />
                    <span className="toggle-track">
                        <span className="toggle-thumb" />
                    </span>
                </label>

                <button
                    type="button"
                    className={`expand-btn ${expanded ? 'expanded' : ''}`}
                    onClick={() => onToggleExpand(item.id)}
                    title={expanded ? 'Collapse' : 'Edit label'}
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
            </div>

            {expanded && (
                <div className="nav-item-edit">
                    <div className="nav-edit-field">
                        <label>Label</label>
                        <input
                            value={item.label}
                            onChange={(e) => onChange(idx, 'label', e.target.value)}
                            placeholder="e.g. Dashboard"
                            autoFocus
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default function SidebarConfigForm({ initialData, onSave, loading }) {
    const [items, setItems] = useState([]);
    const [expandedId, setExpandedId] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
    );

    useEffect(() => {
        if (initialData?.sidebar?.items) {
            setItems(
                initialData.sidebar.items.map((item, i) => ({
                    ...item,
                    id: item.id || `sidebar-${i}-${item.label}`
                }))
            );
        }
    }, [initialData]);

    const handleDragEnd = ({ active, over }) => {
        if (!over || active.id === over.id) return;
        const oldIdx = items.findIndex((i) => i.id === active.id);
        const newIdx = items.findIndex((i) => i.id === over.id);
        setItems(arrayMove(items, oldIdx, newIdx));
    };

    const handleChange = (idx, field, value) => {
        setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ sidebar: { items } });
    };

    const enabledCount = items.filter((i) => i.isVisible).length;

    return (
        <form className="config-form" onSubmit={handleSubmit}>
            <section className="form-section">
                <div className="section-title-row">
                    <h3 className="section-title">Sidebar Menu</h3>
                    {items.length > 0 && (
                        <span className="section-count-badge">{enabledCount}/{items.length} enabled</span>
                    )}
                </div>
                <p className="section-desc">Drag to reorder · toggle to show or hide · expand to rename.</p>
                <div className="navbar-items-container">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                            {items.map((item, idx) => (
                                <SortableSidebarItem
                                    key={item.id}
                                    item={item}
                                    idx={idx}
                                    expanded={expandedId === item.id}
                                    onToggleExpand={(id) => setExpandedId((prev) => (prev === id ? null : id))}
                                    onChange={handleChange}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                </div>
            </section>

            <button type="submit" className="btn-save" disabled={loading}>
                {loading ? 'Saving…' : 'Save Changes'}
            </button>
        </form>
    );
}
