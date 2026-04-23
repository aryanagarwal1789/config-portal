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

export function DragHandle({ attributes, listeners }) {
    return (
        <span className="admin-drag-handle" {...attributes} {...listeners} title="Drag to reorder">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="4" cy="3" r="1.2" fill="currentColor"/>
                <circle cx="10" cy="3" r="1.2" fill="currentColor"/>
                <circle cx="4" cy="7" r="1.2" fill="currentColor"/>
                <circle cx="10" cy="7" r="1.2" fill="currentColor"/>
                <circle cx="4" cy="11" r="1.2" fill="currentColor"/>
                <circle cx="10" cy="11" r="1.2" fill="currentColor"/>
            </svg>
        </span>
    );
}

export function SortableRow({ id, children }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 'auto'
    };
    return (
        <div ref={setNodeRef} style={style} className={isDragging ? 'is-dragging' : ''}>
            {children({ attributes, listeners, isDragging })}
        </div>
    );
}

export default function SortableList({ items, getId, onReorder, children }) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
    );

    const handleDragEnd = ({ active, over }) => {
        if (!over || active.id === over.id) return;
        const oldIdx = items.findIndex((i) => getId(i) === active.id);
        const newIdx = items.findIndex((i) => getId(i) === over.id);
        if (oldIdx === -1 || newIdx === -1) return;
        onReorder(arrayMove(items, oldIdx, newIdx));
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((i) => getId(i))} strategy={verticalListSortingStrategy}>
                {children}
            </SortableContext>
        </DndContext>
    );
}
