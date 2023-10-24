import classNames from "classnames";

import "./ToolInline.scss";
import { CoordinateType } from "../../../types/DimensionType";

export type ToolInlineProps = {
  position: CoordinateType;
  className?: string;
  children?: any;
};

const ToolInline = ({
  className,
  position,
  ...otherProps
}: ToolInlineProps) => (
  <div
    style={{ left: position.x + "px", top: position.y + "px" }}
    className={classNames("inline-tool", className)}
    {...otherProps}
  />
);

export default ToolInline;
