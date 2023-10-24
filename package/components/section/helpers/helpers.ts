import { getId } from "../../../lib/getId";
import { DimensionType } from "../../../types";
import {
  AreaType,
  AreaContentDefinitionType,
  MediaDataType,
  AreaContentType,
} from "../../area";
import {
  create as areaCreate,
  isEmpty as areaIsEmpty,
  calculateRatios as areaCalculateRatios,
  getTypes as areaGetTypes,
} from "../../area";
import { SectionType, SectionDefinition } from "../types";
import { scrollToCenter as domScrollToCenter } from "../../../lib/dom";
import { getTypeAreaMetas } from "./getTypeAreaMetas";

export const scrollToCenter = (sectionId: number) => {
  const sectionElem = document.getElementById(sectionId.toString());
  if (sectionElem) domScrollToCenter(sectionElem, "smooth");
};

const widthAreaAdjusted = (area: AreaType): number | null => {
  if (!area) return null;

  //Find first area type with dimensions set
  const contentsWithWidth = (
    area.contents as AreaContentType<MediaDataType>[]
  ).find((x) => !!x.data.width);

  if (!contentsWithWidth || !contentsWithWidth.data) return null;

  const width = contentsWithWidth.data.width;

  if (!width) return null;

  // if(isNaN(width)) return null;

  return Math.min(100, width);
};

const heightAreaAdjusted = (area: AreaType, margin: number): number | null => {
  if (!area) return null;

  //Find first area type with dimensions set
  const contentsWithDimensions = (
    area.contents as AreaContentType<MediaDataType>[]
  ).find((x) => !!x.data?.width && !!x.data?.height);

  if (!contentsWithDimensions || !contentsWithDimensions.data) return null;

  const width = contentsWithDimensions.data.width;
  const height = contentsWithDimensions.data.height;

  if (!width || !height) return null;

  // if(isNaN(width) || isNaN(height)) return null;

  return (height / width) * 100 + margin / 100;
};

export const getDimensionsFitToAreas = (
  areas: AreaType[],
  _type: string,
  margin: number
): DimensionType => {
  const area = areas[0];

  const width = !area ? 0 : widthAreaAdjusted(area) || 0;
  const height = !area ? 0 : heightAreaAdjusted(area, margin) || 0;

  return { width, height };
};

export const getAdjustedToAreas = (section: SectionType): SectionType => {
  const { width, height } = getDimensionsFitToAreas(
    section.areas,
    section.type,
    section.data.margin
  );

  if (width) section.width = width;
  if (height) {
    section.height = height;

    section.areas.forEach((y) => {
      const { widthHeightRatioContent, widthHeightRatio } = areaCalculateRatios(
        y.width,
        y.height,
        y.order
      );
      y.widthHeightRatio = widthHeightRatio;
      y.widthHeightRatioContent = widthHeightRatioContent;
    });
  }

  return section;
};

export const create = (
  type: string,
  sectionDefinition: SectionDefinition,
  order: number,
  margin: number,
  areas?: AreaType[]
): SectionType => {
  //Reset the height of stuff in section
  const newSection: SectionType = {
    id: getId(),
    type: type,
    order: order,
    width: sectionDefinition.width || 100,
    height: sectionDefinition.height || 100,
    data: { margin },
    areas: [],
  };

  const areasMeta = getTypeAreaMetas(sectionDefinition);

  //Reset heights on existing areas
  if (areas) {
    areas.forEach((x) => {
      let area = null;

      const areaMeta = areasMeta.find((y) => y.order === x.order);
      if (areaMeta) {
        area = areaCreate(
          areaMeta.width,
          areaMeta.height,
          x.order,
          newSection,
          x.contents
        );
        if (x.id) area.id = x.id;
      } else {
        //Deep copy stuff
        area = { ...x };
      }

      return newSection.areas.push(area);
    });
  }

  newSection.areas = getWithAreasPadded(newSection, sectionDefinition);

  //If a single area section, adjust section height if content prefers it
  const { width, height } = getDimensionsFitToAreas(
    newSection.areas,
    newSection.type,
    newSection.data.margin
  );

  if (width) newSection.width = width;
  if (height) newSection.height = height;

  return newSection;
};

export const isEmpty = (section: SectionType, allowAreaTypes = true) => {
  return !section.areas.some((x) => !areaIsEmpty(x.contents, allowAreaTypes));
};

export const getAreaCount = (sectionDefinition: SectionDefinition) => {
  return sectionDefinition.areas.length;
};

export const getWithAreasPadded = (
  section: SectionType,
  sectionDefinition: SectionDefinition
) => {
  const sectionAreaCount = getAreaCount(sectionDefinition);

  if (section.areas.length >= sectionAreaCount) return section.areas;

  const areasMeta = getTypeAreaMetas(sectionDefinition);

  areasMeta.forEach((x) => {
    if (!section.areas.find((y) => y.order === x.order))
      section.areas.push(areaCreate(x.width, x.height, x.order, section));
  });

  return section.areas;
};

export const hasAutoHeightOnly = (
  section: SectionType,
  sectionDefinition: SectionDefinition,
  areaTypes: AreaContentDefinitionType<any>[]
) => {
  if (!section) return false;

  let areas = section.areas;
  //Only check visible
  const areaCount = getAreaCount(sectionDefinition);
  if (areas.length > areaCount) areas = [...areas].slice(0, areaCount);

  if (isEmpty(section, false)) return false;

  return !areas.some(
    (area) =>
      area.contents.length === 0 ||
      areaGetTypes(area.contents).some((name) => {
        const type = areaTypes.find((x) => x.type === name);

        return type?.isAutoHeight !== true;
      })
  );
};

const SECTION_MIN_PERCENTAGE = 25;

export const setDimensions = (
  section: SectionType,
  { width, height }: DimensionType
) => {
  const orgWidth = width;
  width = Math.min(100, Math.max(SECTION_MIN_PERCENTAGE, width));

  //min width modified
  if (orgWidth !== width)
    height = Math.max(SECTION_MIN_PERCENTAGE, height * (orgWidth / width));

  const newSection = {
    ...section,
    width: width,
    height: height,
    areas: section.areas.map((x) => {
      const { widthHeightRatioContent, widthHeightRatio } = areaCalculateRatios(
        x.width,
        x.height,
        height
      );
      x.widthHeightRatio = widthHeightRatio;
      x.widthHeightRatioContent = widthHeightRatioContent;

      return x;
    }),
  };

  return newSection;
};
