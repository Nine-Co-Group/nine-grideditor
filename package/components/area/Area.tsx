import { CSSProperties, DragEvent, useRef, useState } from "react";
import classNames from "classnames";
import { useThrottledCallback } from "use-debounce";
import { dragAndDrop as supportsDragAndDrop } from "../../lib/support";

import { FormattedMessage } from "react-intl";
import { DimensionType, CoordinateType } from "../../types";
import { AreaContentTypeProp, AreaType, IncomingContent } from "./types";
import { Icon, Modal } from "../ui";
import AreaControls from "./Controls";
import {
  getTypes,
  addContentType,
  filesResult,
  dropResult,
  setContentValue,
} from "./helpers";

import "./Area.scss";

type Props = {
  id: string;
  area: AreaType;
  style: CSSProperties;
  isActive: boolean;
  dimensionsPx: DimensionType;
  areaTypes: AreaContentTypeProp<any>[];
  onActiveChange?(area: AreaType, isActive: boolean): void;
  onSwap?(area1Id: number, area2Id: number): void;
  onChange?(area: AreaType, isNewContent?: boolean): void;
  onResize?(area: AreaType, corner: string, newDimensions: DimensionType): void;
  onResizeEnd?(): void;
  onContentsReceived?(datas: IncomingContent[]): void;
  onSomethingReceived?(datas: any[]): void;
  className?: string;
  onRemove?(area: AreaType): void;
  withControls: boolean;
  withExpandablePicker: boolean;
  onDragChange?(isDragging: boolean): void;
};

const Area = ({
  area,
  className,
  onChange,
  onRemove,
  withControls,
  withExpandablePicker,
  dimensionsPx,
  isActive,
  style,
  onResize: _onResize,
  onResizeEnd: _onResizeEnd,
  onActiveChange,
  onSwap,
  areaTypes,
  onContentsReceived,
  onSomethingReceived,
  onDragChange,
  ...otherProps
}: Props) => {
  const [stylesState, setStylesState] = useState<CSSProperties>({});
  const [isDropping, setIsDropping] = useState(false);
  // const [//isDragging, setIsDragging//] = useState(sDragging: false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setisTyping] = useState(false);
  const [isDraggable, setisDraggable] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dimensionsResizeStart, setdimensionsResizeStart] =
    useState<DimensionType>({ width: 0, height: 0 });
  const [dimensionsResizeStartPx, setdimensionsResizeStartPx] =
    useState<DimensionType>({ width: 0, height: 0 });
  const [dropData, setDropData] = useState<IncomingContent[] | undefined>();

  const elem = useRef<HTMLDivElement>(null);

  const onFocus = () => {
    //
  };

  const onBlur = () => {
    //
  };

  const onClick = (e: any) => {
    const pointerActive = window.matchMedia("(pointer:coarse)").matches
      ? "coarse"
      : undefined;

    //Create first area type on empty area
    if (
      e.target.classList.contains("area") ||
      e.target.classList.contains("area-content")
    ) {
      const types = getTypes(area.contents);
      const hasType = types.length > 0;

      if (isActive && pointerActive !== "coarse" && !hasType) {
        const firstType = areaTypes[0]!;
        const newarea = addContentType(areaTypes, area, firstType.type);

        if (onChange) onChange(newarea);
      }
    }

    const types = getTypes(area.contents);
    const isContentEditable =
      areaTypes
        .filter((x) => types.includes(x.type))
        .filter((x) => x.contentType === "html" || x.contentType === "text")
        .length > 0;

    if (!isActive) activate();

    // Pressing on active area with touch deactivates
    if (
      isActive &&
      pointerActive === "coarse" &&
      !isContentEditable &&
      e.target.tagName.toLowerCase() !== "input" &&
      e.target.tagName.toLowerCase() !== "button"
    )
      deactivate();
  };

  const activate = () => {
    if (!isActive && !!onActiveChange) onActiveChange(area, true);
  };

  const deactivate = () => {
    if (isActive && !!onActiveChange) onActiveChange(area, false);
  };

  const onDragEnter = (e: any) => {
    e.preventDefault();

    if (e.target !== elem.current) return;

    setIsDropping(true);
  };

  const onDragLeave = (e: any) => {
    e.preventDefault();

    if (e.target !== elem.current) return;

    setIsDropping(false);
  };

  const onDragStart = (e: any) => {
    if (!elem.current) return;

    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text", JSON.stringify({ areaId: area.id }));

    if (onDragChange) onDragChange(true);
  };

  const onDraggableChange = (isDraggable: boolean) => {
    setisDraggable(isDraggable);
  };

  const onDragEnd = (e: any) => {
    e.preventDefault();

    // setIsDragging(false);

    if (onDragChange) onDragChange(false);
  };

  const onFiles = async (files: File[]) => {
    setIsLoading(true);

    try {
      const datas = await filesResult(files, areaTypes);

      setIsLoading(false);

      if (!datas.length) return;

      const types = getTypes(area.contents);
      const warnsOnRemove = areaTypes
        .filter((x) => types.includes(x.type))
        .some(
          (config) =>
            config.warnOnRemove?.(
              area.contents.find((x) => x.type === x.type)?.data
            ) === true
        );

      if (warnsOnRemove) {
        setDropData(datas);
      } else onDropDo(datas);

      if (datas.length > 1 && !!onContentsReceived) onContentsReceived(datas);
    } catch (err) {
      setIsLoading(false);
    }
  };

  const onDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    setIsDropping(false);

    //Uploads, handled in editor prop
    if (!!e.dataTransfer && e.dataTransfer.files.length > 0) {
      onFiles([...e.dataTransfer.files]);
      return;
    }

    setIsLoading(true);

    try {
      const r = await dropResult(e);

      setIsLoading(false);

      if (onSwap) onSwap(r.areaId, area.id);
    } catch (err) {
      setIsLoading(false);
    }
  };

  const onDropOk = () => {
    if (dropData) onDropDo(dropData);
    setDropData(undefined);
  };

  const onDropCancel = () => {
    setDropData(undefined);
  };

  const onDropDo = (datas: IncomingContent[]) => {
    let newArea = area;

    datas.forEach(
      (data) =>
        (newArea = addContentType(areaTypes, newArea, data.type, data.data))
    );

    console.log(datas);

    if (onChange) onChange(newArea, true);

    activate();
  };

  const onResize = (changePx: CoordinateType, corner: string) => {
    onResizeThrottled(changePx, corner);
  };

  const onResizeThrottled = useThrottledCallback((changePx, corner) => {
    if (!dimensionsResizeStart.width || !dimensionsResizeStart.height) {
      // activate();

      const newDimensionsResizeStart = {
        width: area.width,
        height: area.height,
      };
      const newDimensionsResizeStartPx = {
        width: (dimensionsPx.width / area.width) * 100,
        height: (dimensionsPx.height / area.height) * 100,
      };

      setIsResizing(true);
      setdimensionsResizeStart(newDimensionsResizeStart);
      setdimensionsResizeStartPx(newDimensionsResizeStartPx);

      const newDimensions = getDimensions(
        newDimensionsResizeStart,
        newDimensionsResizeStartPx,
        changePx,
        corner
      );

      if (_onResize) _onResize(area, corner, newDimensions);
      return;
    }

    const newDimensions = getDimensions(
      dimensionsResizeStart,
      dimensionsResizeStartPx,
      changePx,
      corner
    );

    if (_onResize) _onResize(area, corner, newDimensions);
  }, 25);

  const getDimensions = (
    dimensionsResizeStart: DimensionType,
    dimensionsResizeStartPx: DimensionType,
    changePx: CoordinateType,
    corner: string
  ) => {
    //Moved distance in percent
    const change = {
      x: (changePx.x / dimensionsResizeStartPx.width) * 100,
      y: (changePx.y / dimensionsResizeStartPx.height) * 100,
    };

    const newDimensions = {
      width: dimensionsResizeStart.width,
      height: dimensionsResizeStart.height,
    };
    if (corner.includes("left")) {
      newDimensions.width = dimensionsResizeStart.width - change.x;
    }
    if (corner.includes("right")) {
      newDimensions.width = dimensionsResizeStart.width + change.x;
    }
    if (corner.includes("top")) {
      newDimensions.height = dimensionsResizeStart.height - change.y;
    }
    if (corner.includes("bottom")) {
      newDimensions.height = dimensionsResizeStart.height + change.y;
    }

    return newDimensions;
  };

  const onResizeEnd = () => {
    setIsResizing(false);
    setdimensionsResizeStart({ width: 0, height: 0 });
    setdimensionsResizeStartPx({ width: 0, height: 0 });

    if (_onResizeEnd) _onResizeEnd();
  };

  const onContentFocus = () => setisTyping(true);
  const onContentBlur = () => setisTyping(false);

  const onTypeChange = (type: string, dataChunk: any) => {
    const componentType = areaTypes.find((x) => x.type === type);

    const newArea = setContentValue(
      areaTypes,
      area,
      type,
      componentType!.onTypeChange?.(dataChunk) || dataChunk
    );

    if (onChange) onChange(newArea);
  };

  const onPaste = (e: any) => {
    if (document.activeElement !== elem.current) return;

    if (getTypes(area.contents).length) return;

    if (onSomethingReceived)
      onSomethingReceived([e.clipboardData.getData("Text")]);
  };

  if (!area) return null;

  const typeNames = getTypes(area.contents);

  const empty = area.contents.length === 0;

  return (
    <>
      <RemoveConfirm
        key="alert"
        isOpen={!!dropData?.length}
        onClose={onDropCancel}
        onOk={onDropOk}
      />
      <div
        className={classNames(
          "area",
          {
            active: isActive,
            editable: withControls,
            "has-type": typeNames.length > 0,
            "is-empty": empty,
            loading: isLoading,
            dropping: isDropping,
            typing: isTyping,
            resizing: isResizing,
            // dragging: isDragging,
          },
          className
        )}
        data-type={typeNames.length > 0 ? typeNames.join("-") : undefined}
        style={{
          width: area.width + "%",
          ...style,
          ...stylesState,
          height: area.height !== undefined ? area.height + "%" : "",
        }}
        tabIndex={withControls ? 0 : undefined}
        onFocus={withControls ? onFocus : undefined}
        onBlur={withControls ? onBlur : undefined}
        onClick={withControls ? onClick : undefined}
        onDragEnter={withControls ? onDragEnter : undefined}
        onDragOver={withControls ? (e) => e.preventDefault() : undefined}
        onDragLeave={withControls ? onDragLeave : undefined}
        onDrop={withControls ? onDrop : undefined}
        onDragStart={withControls ? onDragStart : undefined}
        onDragEnd={withControls ? onDragEnd : undefined}
        onPaste={withControls ? onPaste : undefined}
        // dropzone={withControls ? "" : undefined}
        draggable={withControls ? isDraggable || undefined : undefined}
        ref={withControls ? elem : undefined}
        {...otherProps}
      >
        {!!withControls && (
          <>
            {!!onChange && !!onRemove && (
              <AreaControls
                area={area}
                isActive={isActive}
                onChange={onChange}
                onRemove={onRemove}
                onResize={onResize}
                onResizeEnd={onResizeEnd}
                onDraggableChange={onDraggableChange}
                onFiles={onFiles}
                areaTypes={areaTypes}
                withExpandablePicker={withExpandablePicker}
                onSomethingReceived={onSomethingReceived}
              />
            )}
            {typeNames.length === 0 && (
              <div className="area-content">
                {!!withControls && (
                  <span className="hint">
                    <Icon id={`add`} />
                    <span>
                      <FormattedMessage
                        id={
                          supportsDragAndDrop()
                            ? "dnd_here_or_press_to_add"
                            : "press_to_add"
                        }
                      />
                    </span>
                  </span>
                )}
              </div>
            )}
          </>
        )}
        {area.contents.map((x) => {
          const type = areaTypes.find((y) => y.type === x.type);
          if (!type) return null;

          const TypeRender = type.render;
          if (!TypeRender) return null;

          return (
            <TypeRender
              withControls={withControls}
              key={x.type}
              area={area}
              data={x.data}
              onStyle={setStylesState}
              isActive={isActive}
              isTyping={isTyping}
              onFocus={onContentFocus}
              onBlur={onContentBlur}
              onClick={onClick}
              onTypeChange={(data) => onTypeChange(x.type, data)}
              className="area-content"
            />
          );
        })}
      </div>
    </>
  );
};

export default Area;

const RemoveConfirm = (props: any) => {
  return (
    <Modal {...props}>
      <FormattedMessage id="are_you_sure"></FormattedMessage>
    </Modal>
  );
};
