import React, { useState, useEffect, useMemo, useCallback } from "react";
import ReactDOM from "react-dom";
import classNames from "classnames";
import {
  getTypeAreaMetas,
  setDimensions,
  SectionDefinitionNamed,
  SectionType,
  Toolbar as SectionToolbar,
} from "./section";
import {
  AreaContentTypeProp,
  AreaType,
  AreaAndMetaType,
  AreaToolbarContainer as AreaToolbar,
} from "./area";

import { DimensionType } from "../types";

import "./Toolbar.scss";

const Toolbar = React.forwardRef<
  HTMLDivElement,
  {
    areasActive: number[];
    sections: SectionType[];
    onChange(sections: SectionType[]): void;
    parentElem: Element | undefined;
    sectionsActive: number[];
    className?: string;
    areaTypes: AreaContentTypeProp<any>[];
    onFocus(e: any): void;
    onBlur(e: any): void;
    sectionTypes: SectionDefinitionNamed;
    offset: number;
  }
>(
  (
    {
      parentElem,
      sections,
      sectionsActive,
      areasActive,
      className,
      areaTypes,
      onFocus,
      onBlur,
      onChange,
      sectionTypes,
      offset,
    },
    ref
  ) => {
    const [pointerIsDown, setPointerIsDown] = useState(false);
    const [visualOffset, setVisualOffset] = useState(0);

    const areas = useMemo(() => {
      return sections.reduce((stack, current) => {
        const meta = getTypeAreaMetas(sectionTypes[current.type]!);
        const areas = current.areas
          .filter((x) => areasActive.includes(x.id))
          .map((x) => ({
            area: x,
            meta: meta.find((y) => y.order === x.order)!,
          }));

        return stack.concat(areas);
      }, [] as AreaAndMetaType[]);
    }, [sections, sectionTypes, areasActive]);

    const onAreaChange = useCallback(
      (area: AreaType) => {
        const section = sections.find((x) =>
          x.areas.some((x) => x.id === area.id)
        );

        if (!section) return;

        const newSections = [
          {
            ...section,
            areas: section.areas.map((x) => {
              if (x.id === area.id) {
                return area;
              } else {
                return x;
              }
            }),
          },
        ];

        if (onChange) onChange(newSections);
      },
      [onChange, sections]
    );

    const onToolbarPointerDown = () => setPointerIsDown(true);
    const onToolbarPointerUp = () => setPointerIsDown(false);

    const onSectionDimensionChange = useCallback(
      (areaId: number, dimensions: DimensionType) => {
        const section = sections.find((x) =>
          x.areas.some((x) => x.id === areaId)
        );

        if (!section) return;

        const newSection = setDimensions(section, dimensions);

        if (onChange) onChange([newSection]);
      },
      [onChange, sectionTypes, sections]
    );

    useEffect(() => {
      const visualViewport = (window as any).visualViewport;
      const listener = () => {
        if (!visualViewport) return;

        setVisualOffset(Math.max(0, visualViewport.offsetTop - offset));
      };
      if (visualViewport) visualViewport.addEventListener("scroll", listener);
      return () => {
        if (visualViewport)
          visualViewport.removeEventListener("scroll", listener);
      };
    }, [offset]);

    const render = (
      <div
        className={classNames("grideditor-toolbar", className, {
          "pointer-down": pointerIsDown,
          typing: !!visualOffset,
        })}
        style={{
          transform: visualOffset ? `translateY(${visualOffset}px)` : "",
        }}
        onPointerDown={onToolbarPointerDown}
        onPointerUp={onToolbarPointerUp}
        tabIndex={-1}
        onFocus={onFocus}
        onBlur={onBlur}
        ref={ref}
      >
        {areas.length > 0 && (
          <AreaToolbar
            areas={areas}
            onChange={onAreaChange}
            onSectionDimensionChange={onSectionDimensionChange}
            areaTypes={areaTypes}
          />
        )}
        <SectionToolbar sectionsActive={sectionsActive} sections={sections} />
      </div>
    );

    if (!parentElem) return render;

    return ReactDOM.createPortal(render, parentElem);
  }
);

export default Toolbar;
