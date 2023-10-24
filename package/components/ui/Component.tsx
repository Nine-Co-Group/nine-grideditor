import { forwardRef } from "react";
import classNames from "classnames";
import { Input, type InputProps } from "./Input/index";

type ButtonProps = React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>;

export type Props = (
  | Omit<InputProps, "type">
  | Omit<ButtonProps, "ref" | "type">
) & {
  componentName?: string;
  tagName?: string;
  type?: string;
};

const isButtonProps = (props: any) =>
  !!props.onClick ||
  !!props.onChange ||
  (!!props.type &&
    (props.type === "button" ||
      props.type === "submit" ||
      props.type === "reset"));

const isInputProps = (props: any) =>
  (!!props.type && props.type !== "submit" && props.type !== "button") ||
  !!props.options;

//Creates the correct DOM element base on input parameters
const Component = forwardRef<any, Props>(
  ({ componentName, tagName = "div", children, ...props }, ref) => {
    const childrenWrapped = children;

    const componentClassName = classNames(componentName, props.className);

    if (isInputProps(props))
      return (
        <Input
          ref={ref}
          {...(props as InputProps)}
          className={componentClassName}
        >
          {childrenWrapped}
        </Input>
      );

    if (isButtonProps(props))
      return (
        <button
          type="button"
          {...(props as ButtonProps)}
          className={componentClassName}
        >
          {childrenWrapped}
        </button>
      );

    const TagName: any = tagName;

    return (
      <TagName ref={ref} {...props} className={componentClassName}>
        {childrenWrapped}
      </TagName>
    );
  }
);

export default Component;
