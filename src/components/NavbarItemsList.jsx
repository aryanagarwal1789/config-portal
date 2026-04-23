import { useState } from 'react';
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
import './NavbarItemsList.css';

function SortableNavItem({ item, idx, expanded, onToggleExpand, onChange }) {
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

                <span className={`nav-item-label ${!item.isVisible ? 'label-muted' : ''}`}>
                    {item.label || <em className="placeholder">Untitled</em>}
                </span>

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
                            placeholder="e.g. About Us"
                            autoFocus
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default function NavbarItemsList({ items, onChange }) {
    const [expandedId, setExpandedId] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
    );

    const withIds = items.map((item, i) => ({
        ...item,
        id: item.id || `nav-${i}-${item.label}`
    }));

    const handleDragEnd = ({ active, over }) => {
        if (!over || active.id === over.id) return;
        const oldIdx = withIds.findIndex((i) => i.id === active.id);
        const newIdx = withIds.findIndex((i) => i.id === over.id);
        onChange(arrayMove(withIds, oldIdx, newIdx));
    };

    const handleChange = (idx, field, value) => {
        onChange(withIds.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
    };

    return (
        <div className="navbar-items-container">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={withIds.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                    {withIds.map((item, idx) => (
                        <SortableNavItem
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
    );
}
