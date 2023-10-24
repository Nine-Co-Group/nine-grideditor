import classNames from "classnames";
import { useThrottledCallback } from "use-debounce";
import { FormattedMessage } from "react-intl";

import { Resizer, Picker, DragMover, Remove } from "./tools";

import "./Controls.css";
import { getTypes, setContentValue } from "./helpers";
import { AreaContentTypeProp, AreaType } from "./types";
import { CoordinateType } from "../../types/DimensionType";

import { Icon, Tool } from "../ui";

const VALID_TYPES = [
  "image/*",
  "image/apng",
  "image/avif",
  "image/webp",
  "image/heic",
  "video/*",
];

type Props = {
  areaTypes: AreaContentTypeProp<any>[];
  area: AreaType;
  isActive: boolean;
  onChange(area: AreaType): void;
  onRemove(area: AreaType): void;
  onResizeEnd(): void;
  onResize(changePx: CoordinateType, position: string): void;
  onSomethingReceived?(datas: any[]): void;
  onDraggableChange: any;
  onFiles?(files: File[]): void;
  className?: string;
  withExpandablePicker: boolean;
};

const AreaControls = ({
  area,
  isActive,
  onChange,
  onRemove,
  onResizeEnd,
  onResize,
  onDraggableChange,
  onFiles,
  className,
  areaTypes,
  withExpandablePicker,
}: Props) => {
  const onTypeChange = useThrottledCallback(
    (area: AreaType, type: string, data: any) => {
      const newarea = setContentValue(areaTypes, area, type, data);

      onChange(newarea);
    },
    25
  );

  const types = getTypes(area.contents);
  const hasType = types.length > 0;

  return (
    <>
      <div className={classNames("area-controls", className)}>
        <Resizer
          position="left"
          onResizeEnd={onResizeEnd}
          onResize={onResize}
        />
        {/* <Resizer position="top" onResizeEnd={onResizeEnd} onResize={onResize} /> */}
        <Resizer
          position="right"
          onResizeEnd={onResizeEnd}
          onResize={onResize}
        />
        <Resizer
          position="bottomleft"
          onResizeEnd={onResizeEnd}
          onResize={onResize}
        />
        <Resizer
          position="bottom"
          onResizeEnd={onResizeEnd}
          onResize={onResize}
        />
        <Resizer
          position="bottomright"
          onResizeEnd={onResizeEnd}
          onResize={onResize}
        />
        {!hasType && !!isActive && (
          <Picker
            area={area}
            onChange={onChange}
            onRemove={onRemove}
            areaTypes={areaTypes}
            withIcon
            withEmpty={false}
            prefix="Controls"
            data-visible={withExpandablePicker ? "2" : undefined}
          >
            {!!onFiles && (
              <li className="upload-control">
                <Tool
                  type="file"
                  accept={VALID_TYPES.join(",")}
                  name="image"
                  // capture={"environment"}
                  onChange={(_: any, files: File[]) => onFiles(files)}
                >
                  <Icon id={"upload"} />
                  <span>
                    <FormattedMessage id={"upload"} />
                  </span>
                </Tool>
              </li>
            )}
          </Picker>
        )}

        {hasType && (
          <DragMover area={area} onDraggableChange={onDraggableChange} />
        )}
        {hasType && (
          <Remove
            area={area}
            onRemove={onRemove}
            areaTypes={areaTypes}
            withIcon
          />
        )}

        {area.contents.map((x) => {
          const type = areaTypes.find((y) => y.type === x.type);
          if (!type) return null;

          const TypeControl = type.control;
          if (!TypeControl) return null;

          return (
            <TypeControl
              className={`tools tools-area-${x.type}`}
              key={x.type}
              data={x.data}
              onChange={(data: any) => onTypeChange(area, x.type, data)}
              onRemove={onRemove}
              area={area}
            />
          );
        })}
      </div>
    </>
  );
};

export default AreaControls;
