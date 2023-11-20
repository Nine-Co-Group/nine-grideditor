import { useRef, useState } from "react";
import classNames from "classnames";
import { useThrottledCallback } from "use-debounce";
import Area, { IncomingContent, AreaContentTypeProp, AreaType } from "../area";
import {
  create as areaCreate,
  calculateRatios as areaCalculateRatios,
  getTypes as areaGetTypes,
} from "../area";
import { DimensionType } from "../../types";
import { SectionDefinitionNamed, SectionRectRect, SectionType } from "./types";
import {
  setDimensions,
  getAreaCount,
  getTypeAreaMetas,
  hasAutoHeightOnly,
  getDimensionsFitToAreas,
} from "./helpers";

import "./Section.css";

type Props = {
  section: SectionType;
  withControls: boolean;
  sectionTypes: SectionDefinitionNamed;
  areaTypes: AreaContentTypeProp<any>[];
  onChange?(sections: SectionType[]): void;
  onRemove?(section: SectionType): void;
  areasActive?: number[];
  onAreaActiveChange?(area: AreaType, isActive: boolean): void;
  onContentsReceived?(datas: IncomingContent[]): void;
  onSomethingReceived?(datas: any[]): void;
  onAreaSwap?(area1Id: number, area2Id: number): void;
  rect: SectionRectRect | undefined;
  isAutoHeight: boolean;
  onDragChange?(isDragging: boolean): void;
  onResizeChange?(isResizing: boolean): void;
};

type ResizeType = {
  dimension: string;
  same: number[];
  opposite: number[];
  size: number;
};

const SectionContent = ({
  section,
  sectionTypes,
  withControls,
  onAreaActiveChange,
  onContentsReceived,
  onSomethingReceived,
  areasActive,
  onAreaSwap,
  onChange: _onChange,
  onResizeChange: _onResizeChange,
  onDragChange: _onDragChange,
  onRemove,
  rect,
  areaTypes,
  isAutoHeight,
}: Props) => {
  const [isResizing, setisResizing] = useState(false);
  const [widthResizeStart, setwidthResizeStart] = useState(0);
  const [heightResizeStart, setheightResizeStart] = useState(0);
  const [resizeParameters, setresizeParameters] = useState<
    ResizeType | undefined
  >();

  const elem = useRef<HTMLDivElement>(null);

  const onChange = (newSection: SectionType) => {
    if (_onChange) _onChange([newSection]);
  };

  const sectionDefinition = sectionTypes[section.type]!;

  const onAreaChange = (area: AreaType, isNewContent?: boolean) => {
    let newSection = {
      ...section,
      areas: section.areas.map((x) => {
        if (x.id === area.id) {
          return area;
        } else {
          return x;
        }
      }),
    };

    const dimensions = rect;

    if (isNewContent && !!dimensions && sectionDefinition.areas.length === 1) {
      const { width, height } = getDimensionsFitToAreas(
        [area],
        newSection.type,
        newSection.data.margin
      );

      if (!!width || !!height) {
        newSection = setDimensions(newSection, {
          width,
          height,
        });
      }
    }

    onChange(newSection);
  };

  const onAreaRemove = (area: AreaType) => {
    if (!!areasActive && areasActive.includes(area.id)) {
      if (onAreaActiveChange) onAreaActiveChange(area, false);
    }

    //Remove entire row if only one area
    if (getAreaCount(sectionDefinition!) === 1) {
      if (onRemove) onRemove(section);
      return;
    }

    const newSection = {
      ...section,
      areas: section.areas.map((x) =>
        x.id !== area.id
          ? x
          : {
              ...areaCreate(x.width, x.height, x.order, section),
              id: x.id,
            }
      ),
    };

    onChange(newSection);
  };

  const onResize = (corner: string, change: any) => {
    onResizeThrottled(corner, change);
  };
  const onResizeThrottled = useThrottledCallback(
    (corner: string, change: any) => {
      if (!widthResizeStart || !heightResizeStart) {
        setisResizing(true);
        setwidthResizeStart(section.width);
        setheightResizeStart(section.height);
        return;
      }

      const newDimensions = {
        width: widthResizeStart,
        height: heightResizeStart,
      };

      // Change.x/y is a percentage number, and needs to be treated as such
      if (corner.includes("left") || corner.includes("right")) {
        newDimensions.width =
          widthResizeStart + (widthResizeStart * change.x * 2) / 100;

        //Change height to make it NOT resize proportionally
        if (!corner.includes("bottom")) {
          newDimensions.height =
            heightResizeStart / (newDimensions.width / widthResizeStart);
        }
      } else if (corner.includes("bottom")) {
        newDimensions.height =
          heightResizeStart + (heightResizeStart * change.y) / 100;
      }

      const newSection = setDimensions(section, newDimensions);

      onChange(newSection);
    },
    25
  );

  const getColumnIds = (column: number): number[] => {
    const areasMeta = getTypeAreaMetas(sectionDefinition);
    const areaOrders = areasMeta
      .filter((x) => x.column === column)
      .map((x) => x.order);

    return section.areas
      .filter((x) => areaOrders.includes(x.order))
      .map((x) => x.id);
  };

  const determineResizeParameters = (
    area: AreaType,
    corner: string
  ): ResizeType => {
    const areasMeta = getTypeAreaMetas(sectionDefinition);
    const areaMeta = areasMeta.find((x) => x.order === area.order);

    const parameters: ResizeType = {
      dimension: "",
      same: [],
      opposite: [],
      size: 0,
    };

    if (
      !areaMeta ||
      (corner.includes("left") && areaMeta.isLeft) ||
      (corner.includes("right") && areaMeta.isRight) ||
      (corner.includes("top") && areaMeta.isTop) ||
      (corner.includes("bottom") && areaMeta.isBottom)
    ) {
      //No area resize to be done
      return parameters;
    }

    //Determine IDs that are to be changed
    if (corner.includes("left")) {
      parameters.dimension = "horizontal";
      parameters.same = getColumnIds(areaMeta.column);
      parameters.opposite = getColumnIds(areaMeta.column - 1);
    } else if (corner.includes("right")) {
      parameters.dimension = "horizontal";
      parameters.same = getColumnIds(areaMeta.column);
      parameters.opposite = getColumnIds(areaMeta.column + 1);
    } else if (corner.includes("top")) {
      parameters.dimension = "vertical";
      parameters.same = [area.id];
      const oarea = section.areas.find((x) => x.order === area.order - 1);
      if (oarea) {
        parameters.opposite = [oarea.id];
      }
    } else if (corner.includes("bottom")) {
      parameters.dimension = "vertical";
      parameters.same = [area.id];
      const oarea = section.areas.find((x) => x.order === area.order + 1);
      if (oarea) {
        parameters.opposite = [oarea.id];
      }
    }

    //Determine total width of column/row
    if (parameters.dimension === "horizontal") {
      parameters.size =
        section.areas.filter((x) => x.id === parameters.same[0])[0]!.width +
        section.areas.filter((x) => x.id === parameters.opposite[0])[0]!.width;
    } else if (parameters.dimension === "vertical") {
      parameters.size =
        section.areas.filter((x) => x.id === parameters.same[0])[0]!.height +
        section.areas.filter((x) => x.id === parameters.opposite[0])[0]!.height;
    }
    return parameters;
  };

  const onAreaResize = (
    area: AreaType,
    corner: string,
    newDimensions: DimensionType
  ) => {
    onAreaResizeThrottled(area, corner, newDimensions);
    if (_onResizeChange) _onResizeChange(true);
  };
  const onAreaResizeThrottled = useThrottledCallback(
    (area: AreaType, corner: string, newDimensions: DimensionType) => {
      const areasMeta = getTypeAreaMetas(sectionDefinition);
      const areaMeta = areasMeta.find((x) => x.order === area.order);

      if (isAutoHeight && corner.includes("bottom")) return;

      const areaChange = {
        x: newDimensions.width - area.width,
        y: newDimensions.height - area.height,
      };

      if (
        !areaMeta ||
        (areaMeta.isLeft && corner.includes("left")) ||
        (areaMeta.isRight && corner.includes("right")) ||
        (areaMeta.isBottom && corner.includes("bottom"))
      ) {
        //Section resize
        onResize(corner, areaChange);
        return;
      }

      if (!resizeParameters || !isResizing) {
        setisResizing(true);
        setresizeParameters(determineResizeParameters(area, corner));
        return;
      }

      const newSection = {
        ...section,
        areas: section.areas.map((x) => {
          const same =
            resizeParameters.same.findIndex((y) => y === x.id) !== -1;
          const opposite =
            resizeParameters.opposite.findIndex((y) => y === x.id) !== -1;
          if (same || opposite) {
            const MIN_SIZE = 10;
            let newWidth = x.width;
            let newHeight = x.height;
            if (resizeParameters.dimension === "horizontal") {
              newWidth = same ? x.width + areaChange.x : x.width - areaChange.x;
              newWidth = Math.max(
                MIN_SIZE,
                Math.min(resizeParameters.size - MIN_SIZE, newWidth)
              );
            } else if (resizeParameters.dimension === "vertical") {
              newHeight = same
                ? x.height + areaChange.y
                : x.height - areaChange.y;
              newHeight = Math.max(
                MIN_SIZE,
                Math.min(resizeParameters.size - MIN_SIZE, newHeight)
              );
            }
            const { widthHeightRatioContent, widthHeightRatio } =
              areaCalculateRatios(newWidth, newHeight, section.height);
            return {
              ...x,
              width: newWidth,
              height: newHeight,
              widthHeightRatio,
              widthHeightRatioContent,
            };
          }
          return x;
        }),
      };

      onChange(newSection);
    },
    25
  );

  const onAreaResizeEnd = () => {
    //Reset section resize variables
    setisResizing(false);
    setresizeParameters(undefined);
    setwidthResizeStart(0);
    setheightResizeStart(0);

    if (_onResizeChange) _onResizeChange(false);
  };

  const onAreaDragChange = (dragging: boolean) => {
    if (_onDragChange) _onDragChange(dragging);
  };

  const getHeight = () => {
    return section.height * (section.width / 100);
  };

  const pointerActive = window.matchMedia("(pointer:coarse)").matches
    ? "coarse"
    : undefined;

  if (!sectionDefinition)
    throw new Error("Invalid section type " + section.type);

  let offset = 0;

  const totalMargins = sectionDefinition.areas.length - 1;

  const areasMeta = getTypeAreaMetas(sectionDefinition);

  const withExpandablePicker =
    pointerActive === "coarse" && sectionDefinition.areas.length !== 1;

  console.log("section", section.id, areasActive);

  return (
    <div
      className={classNames("nge-section-content", {
        // "has-auto-height": hasAutoHeightArea(),
        "is-auto-height": isAutoHeight,
        resizing: isResizing,
      })}
      style={{
        marginTop: section.data.margin / 2 + "rem",
        marginBottom: section.data.margin / 2 + "rem",
        paddingTop: parseFloat(getHeight().toString()).toFixed(4) + "%",
        width: section.width + "%",
      }}
      // onPointerMove={withControls ? onPointerMove : undefined}
      ref={withControls ? elem : undefined}
    >
      {sectionDefinition.areas.map((_, i) => {
        const area: AreaType | undefined = section.areas[i];

        const meta = areasMeta[i];

        if (!area || !meta) return null;

        const perAreaMargin =
          (totalMargins / sectionDefinition.areas.length) * section.data.margin;

        const widthPx = rect ? rect.width * (area.width / 100) : 0;
        const heightPx =
          !!widthPx && !!area.widthHeightRatio
            ? widthPx / area.widthHeightRatio
            : 0;

        const dom = (
          <Area
            key={i}
            id={area.id.toString()} //Used for click target detection
            area={area}
            isActive={!!areasActive && areasActive.includes(area.id)}
            className={classNames("is-top", {
              left: meta.isLeft,
              right: meta.isRight,
            })}
            withControls={withControls}
            withExpandablePicker={withExpandablePicker}
            dimensionsPx={{
              height: isAutoHeight ? 0 : heightPx,
              width: widthPx,
            }}
            style={{
              left: !offset
                ? ""
                : "calc(" +
                  offset +
                  "% + " +
                  (perAreaMargin / (sectionDefinition.areas.length - 1)) * i +
                  "rem)",
              width: "calc(" + area.width + "% - " + perAreaMargin + "rem)",
              height: isAutoHeight ? "" : undefined,
            }}
            // onDrop={onAreaDrop}
            onChange={onAreaChange}
            onRemove={onAreaRemove}
            onContentsReceived={onContentsReceived}
            onSomethingReceived={onSomethingReceived}
            onActiveChange={onAreaActiveChange}
            onResize={onAreaResize}
            onResizeEnd={onAreaResizeEnd}
            onDragChange={onAreaDragChange}
            onSwap={onAreaSwap}
            areaTypes={areaTypes}
          />
        );
        offset += area.width;
        return dom;
      })}
    </div>
  );
};

const Section = ({
  section,
  className,
  withControls,
  onChange,
  onRemove,
  onAreaSwap,
  onAreaActiveChange,
  areasActive,
  rect,
  sectionTypes,
  areaTypes,
  onContentsReceived,
  onSomethingReceived,
  onDragChange,
  onResizeChange,
  children,
}: {
  section: SectionType;
  className?: string;
  onChange?(sections: SectionType[]): void;
  onRemove?(section: SectionType): void;
  onAreaSwap?(area1Id: number, area2Id: number): void;
  onContentsReceived?(datas: IncomingContent[]): void;
  onSomethingReceived?(datas: any[]): void;
  onAreaActiveChange?(area: AreaType, isActive: boolean): void;
  areasActive?: number[];
  rect?: SectionRectRect;
  sectionTypes: SectionDefinitionNamed;
  areaTypes: AreaContentTypeProp<any>[];
  withControls?: boolean;
  onDragChange?(isDragging: boolean): void;
  onResizeChange?(isResizing: boolean): void;
  children?: React.ReactNode;
}) => {
  const isAutoHeight = hasAutoHeightOnly(
    section,
    sectionTypes[section.type]!,
    areaTypes
  );

  const hasAreaType =
    !!section.areas &&
    section.areas.some((x: AreaType) => areaGetTypes(x.contents).length > 0);

  return (
    <div
      id={section.id.toString()} //Used for click target detection
      className={classNames("nge-section", className, {
        "has-area-type": hasAreaType,
        active: !!areasActive && areasActive.length > 0,
        editable: withControls,
      })}
      data-type={section.type}
    >
      <SectionContent
        section={section}
        onChange={onChange}
        onRemove={onRemove}
        withControls={!!withControls}
        onAreaActiveChange={onAreaActiveChange}
        onContentsReceived={onContentsReceived}
        onSomethingReceived={onSomethingReceived}
        areasActive={areasActive}
        onAreaSwap={onAreaSwap}
        rect={rect}
        sectionTypes={sectionTypes}
        areaTypes={areaTypes}
        isAutoHeight={isAutoHeight}
        onDragChange={onDragChange}
        onResizeChange={onResizeChange}
      />
      {children}
    </div>
  );
};

export default Section;
