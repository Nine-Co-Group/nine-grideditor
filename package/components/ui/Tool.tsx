import Component, { Props as ComponentProps } from "./Component";

import "./Tool.css";

export type ToolProps = ComponentProps;

export const Tool = (props: ToolProps) => (
  <Component {...props} componentName={"nge-tool"} />
);
