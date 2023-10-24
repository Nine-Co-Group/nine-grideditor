import { forwardRef } from "react";
import BaseInput, { Props as BaseProps } from "./BaseInput";
import InputFile, { Props as FileProps } from "./InputFile";

export type InputProps = Omit<FileProps, "ref"> | Omit<BaseProps, "ref">;

//Creates the correct DOM element base on input parameters
export const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  if (props?.type === "file") return <InputFile {...(props as FileProps)} />;

  return <BaseInput ref={ref} {...(props as BaseProps)} />;
});
