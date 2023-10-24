import Component, { Props as ComponentProps } from "./Component";

import "./Input.css";

export type InputProps = ComponentProps;

export const Input = (props: InputProps) => (
  <Component {...props} componentName={"input"} />
);
