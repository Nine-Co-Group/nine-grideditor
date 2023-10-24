import { AreaMeta } from "../section/types";

export type AreaType = {
  id: number;
  order: number;
  width: number;
  height: number;
  contents: AreaContentType<ContentDataTypes>[];
  widthHeightRatio?: number;
  widthHeightRatioContent?: number;
};

export type IncomingContent = {
  // Data is the AreaContentType type
  type: string;
  // Data is the AreaContentType data
  data: ContentDataTypes;
};

export type IncomingArea = {
  areaId: number;
};

export type AreaContentType<T extends ContentDataTypes> = {
  type: string;
  data: T;
};

export type AreaAndMetaType = {
  area: AreaType;
  meta: AreaMeta;
};

export type AreaContentDefinitionType<T extends ContentDataTypes> = {
  type: string;
  contentType: "media" | "html" | "text" | "embed";
  create(): T;
  onTypeValidate?(key: string, value: any): boolean;
  onTypeChange?(data: T): T;
  isAutoHeight?: boolean;
  onRemove?(data: T): void;
  warnOnRemove?(data: T): boolean;
  htmlToData?(
    areaElem: HTMLElement,
    areaContentElem: HTMLElement,
    widthHeightRatio?: number
  ): T;
  onDrop?(data: object): Promise<T>;
  onFiles?(files: File[]): Promise<T[]>;
};

export type AreaContentTypeProp<T extends ContentDataTypes> =
  AreaContentDefinitionType<T> & {
    label: (props: AreaLabelProps<T>) => React.ReactNode;
    control?: (props: AreaControlsProps<T>) => React.ReactNode;
    render: (props: AreaContentProps<T>) => JSX.Element;
  };

export type AreaLabelProps<T extends ContentDataTypes> = {
  withIcon: boolean;
  data: T;
};

export type AreaContentProps<T extends ContentDataTypes> = {
  className?: string;
  withControls: boolean;
  isActive: boolean;
  isTyping: boolean;
  onStyle?: (style: any) => void;
  onFocus(): void;
  onClick?(e: any): void;
  onBlur(): void;
  onTypeChange(data: any): void;
  data: T;
  area: AreaType;
};

export type AreaControlsProps<T extends ContentDataTypes> = {
  className?: string;
  onChange(data: T): void;
  onRemove(area: AreaType): void;
  data: T;
  area: AreaType;
};

type ContentDataTypes = object & (TextDataType | MediaDataType | EmbedDataType);

export type TextDataType = {
  src?: string;
};

export type MediaDataType = {
  url?: string;
  videoUrl?: string;
  alt?: string;
  width: number;
  height: number;
};

export type EmbedDataType = {
  url?: string;
  videoUrl?: string;
  alt?: string;
  width: number;
  height: number;
};
