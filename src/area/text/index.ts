import {
  AreaContentDefinitionType,
  BodyDataType as GridTextDataType,
} from "../../../package/index";

export { TextArea } from "./Text";
export { TextLabel } from "./Label";

export type TextDataType = GridTextDataType;

export const textType: AreaContentDefinitionType<TextDataType> = {
  type: "text",
  contentType: "html",
  isAutoHeight: true,
  create: () => ({
    src: "<p>&#8203;</p>",
  }),
  warnOnRemove: (data) => !!data.src,
};
