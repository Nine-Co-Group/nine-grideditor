import Component, { Props as ComponentProps } from "./Component";

import "../ui/Tool.scss";

export type ToolProps = ComponentProps;

export const Tool = (props: ToolProps) => (
  <Component {...props} componentName={"tool"} />
);
