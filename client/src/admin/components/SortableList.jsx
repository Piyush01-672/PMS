import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

let keySeed = 0;
export const clientKey = () => `k${Date.now().toString(36)}${(keySeed++).toString(36)}`;
export const itemKey = (item) => item?._id || item?._key;
export const withKeys = (list = []) => list.map((item) => (itemKey(item) ? item : { ...item, _key: clientKey() }));

function SortableRow({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return children({
    ref: setNodeRef,
    style: { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : undefined, position: 'relative' },
    handleProps: { ...attributes, ...listeners },
    isDragging,
  });
}

export function DragHandle({ className, ...props }) {
  return (
    <button type="button" className={cn('grid size-8 shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted-foreground hover:bg-muted active:cursor-grabbing', className)} aria-label="Drag to reorder" {...props}>
      <GripVertical className="size-4" />
    </button>
  );
}

/** Keyboard- and touch-accessible drag & drop list. */
export function SortableList({ items, onChange, renderItem, className, as: Tag = 'ul' }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = items.map(itemKey);

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    onChange(arrayMove(items, ids.indexOf(active.id), ids.indexOf(over.id)));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <Tag className={className}>
          {items.map((item, index) => (
            <SortableRow key={itemKey(item)} id={itemKey(item)}>
              {(sortable) => renderItem(item, index, sortable)}
            </SortableRow>
          ))}
        </Tag>
      </SortableContext>
    </DndContext>
  );
}

export const moveItem = (list, from, to) => (to < 0 || to >= list.length ? list : arrayMove(list, from, to));
