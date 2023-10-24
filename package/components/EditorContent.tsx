import { useCallback, useEffect, useRef, useState } from "react";
import classNames from "classnames";

import { useDebouncedCallback } from "use-debounce";
import Section, {
  Controls,
  SectionDefinitionNamed,
  SectionRect,
  SectionRectRect,
  SectionType,
  hasAutoHeightOnly,
} from "./section";
import { AreaContentTypeProp, AreaType, IncomingContent } from "./area";
import { getScrollOffsetParents } from "../lib/dom";
import { CreateArea } from "./section/tools";

const getSectionRect = (elem: HTMLDivElement): SectionRectRect => {
  const {
    top,
    right,
    bottom,
    left,
    width,
    height,
    // x,
    // y
  } = elem.getBoundingClientRect();

  const scrollOffset = getScrollOffsetParents(elem);

  return {
    top: top + scrollOffset.y,
    right: right + scrollOffset.x,
    bottom: bottom + scrollOffset.y,
    left: left + scrollOffset.x,
    width,
    height,
  };
};

const EditorContent = ({
  sections,
  onSectionChangeOrCreate,
  onSectionRemove,
  onAreaSwap,
  onContentsReceived,
  onSomethingReceived,
  onAreaActiveChange,
  margin,
  areasActive,
  sectionTypes,
  areaTypes,
}: {
  sections: SectionType[];
  onSectionChangeOrCreate(sections: SectionType[]): void;
  onSectionRemove(section: SectionType): void;
  onAreaSwap(area1Id: number, area2Id: number): void;
  onContentsReceived?(datas: IncomingContent[]): void;
  onSomethingReceived?(datas: any[]): void;
  onAreaActiveChange(area: AreaType, isActive: boolean): void;
  margin: number;
  areasActive: number[];
  sectionTypes: SectionDefinitionNamed;
  areaTypes: AreaContentTypeProp<any>[];
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  const [sectionsRect, setSectionsRect] = useState<SectionRect[]>([]);

  const contentElem = useRef<HTMLDivElement>(null);

  const setSectionRects = useCallback((data: SectionType[]) => {
    (window as any).requestIdleCallback(() => {
      const affectedSectionIds = data.map((x) => x.id);

      const rects: SectionRect[] = affectedSectionIds
        .map((id) => {
          const sectionElem = document.getElementById(id.toString());

          //This is all async so might happen
          if (!sectionElem) return undefined;

          const entry = sectionElem.firstElementChild as
            | HTMLDivElement
            | undefined;

          //This is all async so might happen
          if (!entry) return undefined;

          const rect = getSectionRect(entry);

          return {
            id,
            rect,
          };
        })
        .filter((x) => !!x) as any[];

      const newRectIds = rects.map((x) => x.id);

      setSectionsRect((x) => {
        const newRects = [
          ...x.filter((x) => !newRectIds.includes(x.id)),
          ...rects,
        ];

        // if (isEqual(x, newRects)) return x;

        return newRects;
      });
    });
  }, []);

  const setSectionRectsDebounced = useDebouncedCallback(setSectionRects, 300);

  useEffect(() => {
    setSectionRectsDebounced(sections);
  }, [sections, setSectionRectsDebounced]);

  const onSectionDragChange = useCallback((isDragging: boolean) => {
    setIsDragging(isDragging);
  }, []);

  const onSectionResizeChange = useCallback((isResizing: boolean) => {
    setIsResizing(isResizing);
  }, []);

  return (
    <div
      className={classNames("grideditor-content", {
        dragging: isDragging,
        resizing: isResizing,
      })}
      ref={contentElem}
    >
      {sections
        .sort((x, y) => (x.order < y.order ? -1 : 1))
        .map((section) => {
          const rect = sectionsRect.find((y) => y.id === section.id);

          return (
            <EditorSection
              key={section.id}
              section={section}
              onContentsReceived={onContentsReceived}
              onSomethingReceived={onSomethingReceived}
              onCreate={onSectionChangeOrCreate}
              onChange={onSectionChangeOrCreate}
              onRemove={onSectionRemove}
              onDragChange={onSectionDragChange}
              onResizeChange={onSectionResizeChange}
              onAreaSwap={onAreaSwap}
              designAreaMargin={margin}
              onAreaActiveChange={onAreaActiveChange}
              areasActive={areasActive.filter((x) =>
                section.areas.some((y) => y.id === x)
              )}
              rect={rect ? rect.rect : undefined}
              sectionTypes={sectionTypes}
              areaTypes={areaTypes}
            />
          );
        })}
      <CreateArea
        sectionTypes={sectionTypes}
        order={sections.length}
        designAreaMargin={margin}
        onCreate={onSectionChangeOrCreate}
        onAreaSwap={onAreaSwap}
        onAreaActiveChange={onAreaActiveChange}
        areaTypes={areaTypes}
      />
    </div>
  );
};

export default EditorContent;

const EditorSection = ({
  section,
  className,
  onCreate,
  onChange,
  onRemove,
  onAreaSwap,
  designAreaMargin,
  onAreaActiveChange,
  areasActive,
  rect,
  sectionTypes,
  areaTypes,
  onContentsReceived,
  onSomethingReceived,
  onDragChange,
  onResizeChange,
}: {
  section: SectionType;
  className?: string;
  onCreate(sections: SectionType[]): void;
  onChange(sections: SectionType[]): void;
  onRemove(section: SectionType): void;
  onAreaSwap(area1Id: number, area2Id: number): void;
  onContentsReceived?(datas: IncomingContent[]): void;
  onSomethingReceived?(datas: any[]): void;
  designAreaMargin: number;
  onAreaActiveChange(area: AreaType, isActive: boolean): void;
  areasActive?: number[];
  rect?: SectionRectRect;
  sectionTypes: SectionDefinitionNamed;
  areaTypes: AreaContentTypeProp<any>[];
  onDragChange?(isDragging: boolean): void;
  onResizeChange?(isResizing: boolean): void;
}) => {
  const isAutoHeight = hasAutoHeightOnly(
    section,
    sectionTypes[section.type]!,
    areaTypes
  );

  return (
    <>
      <CreateArea
        sectionTypes={sectionTypes}
        order={section.order}
        designAreaMargin={designAreaMargin}
        onCreate={onCreate}
        onAreaSwap={onAreaSwap}
        onAreaActiveChange={onAreaActiveChange}
        areaTypes={areaTypes}
      />
      <Section
        className={className}
        section={section}
        onChange={onChange}
        onRemove={onRemove}
        withControls={true}
        onAreaActiveChange={onAreaActiveChange}
        onContentsReceived={onContentsReceived}
        onSomethingReceived={onSomethingReceived}
        areasActive={areasActive}
        onAreaSwap={onAreaSwap}
        rect={rect}
        sectionTypes={sectionTypes}
        areaTypes={areaTypes}
        onDragChange={onDragChange}
        onResizeChange={onResizeChange}
      >
        <Controls
          section={section}
          designAreaMargin={designAreaMargin}
          onCreate={onCreate}
          onChange={onChange}
          onRemove={onRemove}
          sectionTypes={sectionTypes}
          areaTypes={areaTypes}
          onAreaActiveChange={onAreaActiveChange}
          isAutoHeight={isAutoHeight}
        />
      </Section>
    </>
  );
};
