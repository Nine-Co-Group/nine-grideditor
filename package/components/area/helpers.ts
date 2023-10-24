import { getId } from "../../lib/getId";
import { SectionType } from "../section/types";
import {
  AreaContentDefinitionType,
  AreaContentType,
  AreaType,
  IncomingArea,
  IncomingContent,
} from "./types";

export const RATIO_ACCURACY = 5;

export const create = (
  width: number,
  height: number,
  order: number,
  section: SectionType,
  contents?: AreaContentType<any>[]
): AreaType => {
  let area = {
    id: getId(),
    order,
    // types: types || [],
    contents: contents || [],
    width,
    height,
  };

  area = {
    ...area,
    ...calculateRatios(width, height, section.height),
  };

  return area;
};

export const addContentType = (
  types: AreaContentDefinitionType<any>[],
  area: AreaType,
  type: string,
  data?: any
): AreaType => {
  const typeDefinition = types.find((x) => x.type === type);
  if (!typeDefinition) {
    throw new Error("Trying to add invalid content type");
  }

  // if(!area.contents.find(x => x.type === type)) {
  //   throw new Error("Area does not have type");
  // }

  //Validate all content value types
  const defaultData = typeDefinition.create();
  // const addingData = contentDataToValues(data);

  // const validTypes = defaultData.map(x => x.type);
  // const addingTypes = Object.keys(addingData);

  // if (addingTypes.some(contentType => !validTypes.includes(contentType)))
  //   throw new Error("Trying to add invalid content data");

  // const currentContents = area.contents.find(x => x.type === type);
  // let newData = [];
  // if(!!currentContents && !!currentContents.data) {
  //   newData = [...currentContents.data, ...addingData];
  // }
  // else {
  //   newData = [...addingData];
  // }

  const newContents: AreaContentType<any>[] = [
    { type: type, data: defaultData },
  ];

  if (data)
    return setContentValue(
      types,
      { ...area, contents: newContents },
      type,
      data
    );
  return { ...area, contents: newContents };

  // const defaultData = typeDefinition.create();

  // const newcontents = [
  //   {
  //     type,
  //     ...defaultData,
  //     ...(contents || {})
  //   }
  // ];

  // area.contents = newcontents;

  // return area;
};

export const setContentValue = (
  types: AreaContentDefinitionType<any>[],
  area: AreaType,
  type: string, // text / media etc.
  data: any
): AreaType => {
  const typeDefinition = types.find((x) => x.type === type);
  if (!typeDefinition) {
    throw new Error("Trying to add data for invalid type");
  }

  const areaContentsType = area.contents.find((x) => x.type === type);

  if (!areaContentsType) {
    throw new Error("Area does not have type");
  }

  //Validate all content value types
  const addingData = data;

  const validTypes = Object.keys(typeDefinition.create());
  const addingTypes = Object.keys(data);

  if (addingTypes.some((contentType) => !validTypes.includes(contentType)))
    throw new Error("Trying to add invalid content data");

  const newData = {
    ...areaContentsType.data,
    ...addingData,
  };

  const newContents: AreaContentType<any>[] = [{ type: type, data: newData }];

  console.log({ ...area, contents: newContents });

  return { ...area, contents: newContents };
};

export const calculateRatios = (
  areaWidth: number,
  areaHeight: number,
  sectionHeight: number
) => {
  const areaOuterHeight = sectionHeight
    ? sectionHeight * (areaHeight / 100)
    : undefined;

  let areaWidthContent = areaWidth;

  areaWidthContent = areaWidth;

  const areaHeightContent = areaOuterHeight;

  const widthHeightRatioContent = areaHeightContent
    ? parseFloat(
        parseFloat((areaWidthContent / areaHeightContent).toString()).toFixed(
          RATIO_ACCURACY
        )
      )
    : undefined;

  const widthHeightRatio = areaOuterHeight
    ? parseFloat(
        parseFloat((areaWidth / areaOuterHeight).toString()).toFixed(
          RATIO_ACCURACY
        )
      )
    : undefined;

  return { widthHeightRatioContent, widthHeightRatio };
};

export const dropResult = (e: any): Promise<IncomingArea> => {
  //Parse Received data
  let t = e.dataTransfer.getData("text");
  try {
    t = JSON.parse(t);
  } catch (error) {
    //Ignore
  }

  if (!t) return Promise.reject("Nothing dropped (" + t + ")");

  //Area move
  if (t.areaId) return Promise.resolve(t as IncomingArea);

  return Promise.reject("Nothing dropped (" + t + ")");
};

export const filesResult = (
  files: File[],
  types: AreaContentDefinitionType<any>[]
): Promise<IncomingContent[]> => {
  //See if any area type wants this data
  const promises = types
    .map(
      (config) =>
        config
          .onFiles?.(files)
          .then((data) =>
            data.map(
              (x) =>
                ({
                  type: config.type,
                  data: x,
                } as IncomingContent)
            )
          )
          .catch(() => undefined) //Rejected
    )
    .filter((x) => !!x)
    .map((x) => x!);

  return Promise.all(promises).then((results) => {
    const accepted = results
      .filter((x) => !!x)
      .map((x) => x!)
      .flat();

    if (accepted.length === 0) return Promise.reject(`Files not accepted`);

    //Only one type is inserted on drop for now
    return accepted;
  });
};

export const getTypes = (contents: AreaContentType<any>[]) =>
  contents.map((x) => x.type);

export const isEmpty = (
  contents: AreaContentType<any>[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _allowTypes = true
) => {
  return getTypes(contents).length === 0;
};
