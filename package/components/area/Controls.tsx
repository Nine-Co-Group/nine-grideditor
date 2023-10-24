import { useState } from "react";
import classNames from "classnames";
import { useThrottledCallback } from "use-debounce";
import { FormattedMessage } from "react-intl";

import { Resizer, Picker, DragMover, Remove } from "./tools";

import "./Controls.scss";
import { getTypes, setContentValue } from "./helpers";
import { AreaContentTypeProp, AreaType } from "./types";
import { CoordinateType } from "../../types/DimensionType";

import { Icon, Tool, Modal, Input } from "../ui";

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
  onSomethingReceived,
  ...otherProps
}: Props) => {
  const [codeContent, setcodeContent] = useState("");
  const [codeModalIsOpen, setcodeModalIsOpen] = useState(false);

  const onTypeChange = useThrottledCallback(
    (area: AreaType, type: string, data: any) => {
      const newarea = setContentValue(areaTypes, area, type, data);

      onChange(newarea);
    },
    25
  );

  const onToggleCode = () => setcodeModalIsOpen((x) => !x);

  const onCodeChange = (e: any) => {
    const v = e.target.value;
    setcodeContent(v);
  };

  const onCodeOk = () => {
    if (onSomethingReceived) onSomethingReceived([codeContent]);
    setcodeContent("");
    setcodeModalIsOpen(false);
  };
  const types = getTypes(area.contents);
  const hasType = types.length > 0;

  return (
    <>
      <Modal
        className="code"
        contentLabel="code modal"
        isOpen={codeModalIsOpen}
        onClose={onToggleCode}
      >
        <h1 className="header">
          <FormattedMessage id="embed" />
        </h1>
        <div className="main">
          <Input
            value={codeContent}
            onChange={onCodeChange}
            type="textarea"
            label={<FormattedMessage id="embed" />}
          />
        </div>
        <div className="bottom">
          <Tool onClick={onToggleCode}>
            <FormattedMessage id="cancel" />
          </Tool>
          <Tool onClick={onCodeOk}>
            <FormattedMessage id="ok" />
          </Tool>
        </div>
      </Modal>
      <div className={classNames("area-controls", className)} {...otherProps}>
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
            childrenLast={
              areaTypes.some((x) => x.contentType === "embed") ? (
                <li className="paste-control">
                  <Tool onClick={onToggleCode}>
                    <Icon id="html" /> <FormattedMessage id="embed" />
                  </Tool>
                </li>
              ) : null
            }
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
