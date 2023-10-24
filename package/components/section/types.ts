import { AreaType } from "../area";

export type SectionType = {
  id: number;
  order: number;
  width: number;
  height: number;
  type: string;
  data: {
    margin: number;
  };
  areas: AreaType[];
};

export type SectionDefinition = {
  width?: number;
  height: number;
  areas: {
    width: number;
  }[];
};

export type SectionDefinitionNamed = {
  [key: string]: SectionDefinition;
};

export type AreaMeta = {
  width: number;
  height: number;
  order: number;
  column: number;
  isTop: boolean;
  isBottom: boolean;
  isLeft: boolean;
  isRight: boolean;
};

export type SectionRect = {
  id: number;
  rect: SectionRectRect;
};
export type SectionRectRect = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
  // x: number;
  // y: number;
};
