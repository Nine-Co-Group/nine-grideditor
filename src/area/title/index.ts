import {
  AreaContentDefinitionType,
  BodyDataType as GridTextDataType,
} from "../../../package/index";

export { TitleArea } from "./Title";
export { TitleLabel } from "./Label";

export type TitleDataType = GridTextDataType;

export const titleType: AreaContentDefinitionType<TitleDataType> = {
  type: "title",
  contentType: "title",
  isAutoHeight: true,
  create: () => ({
    src: "<p>&#8203;</p>",
  }),
  warnOnRemove: (data) => !!data.src,
};
