/**
 * Generated with the help of v0.dev:
 * https://v0.dev/chat/community/sortable-list-with-color-picker-B4BxfzY1qx8
 */

'use client';

import type React from 'react';
import { Reorder, useDragControls, motion } from 'motion/react';
import { GripVertical, type LucideIcon } from 'lucide-react';

interface SortableItemProps<T> {
  item: T;
  children: React.ReactNode;
  /**
   * @default GripVertical
   */
  gripIcon?: LucideIcon;
}

function SortableItem<T>({
  item,
  children,
  gripIcon: GripIcon = GripVertical,
}: SortableItemProps<T>) {
  const controls = useDragControls();

  return (
    <Reorder.Item value={item} dragControls={controls}>
      <motion.div
        className="bg-card mb-2 flex items-center rounded-lg border px-2 py-4 shadow"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <GripIcon
          className="text-muted-foreground mr-1 shrink-0 cursor-grab"
          onPointerDown={e => controls.start(e)}
        />
        {children}
      </motion.div>
    </Reorder.Item>
  );
}

type SortableListProps<T> = Omit<
  React.ComponentProps<typeof Reorder.Group>,
  'children' | 'onReorder' | 'values'
> & {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
};

export function SortableList<T>({
  items,
  onReorder,
  renderItem,
  keyExtractor,
  ...props
}: SortableListProps<T>) {
  return (
    <Reorder.Group axis="y" values={items} onReorder={onReorder} {...props}>
      {items.map((item, index) => (
        <SortableItem key={keyExtractor(item)} item={item}>
          {renderItem(item, index)}
        </SortableItem>
      ))}
    </Reorder.Group>
  );
}
