import { SectionDefinition, AreaMeta } from "../types";

// Returns arrays of {width,height,order,column,isTop,isBottom,isLeft,isRight}
// for areas in sectionType
export const getTypeAreaMetas = (
  sectionDefinition: SectionDefinition
): AreaMeta[] => {
  let order = -1;
  return sectionDefinition.areas
    .map((x, i) => {
      const isLeft = i === 0;
      const isRight = i === sectionDefinition.areas.length - 1;
      const column = i + 1;
      order++;
      return [
        {
          width: x.width,
          height: 100,
          order: order,
          column,
          isTop: true,
          isBottom: true,
          isLeft,
          isRight,
        },
      ];
    })
    .flat();
};
