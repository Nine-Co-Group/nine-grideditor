import { SectionDefinitionNamed, SectionType } from "../../components/section";
import { fromJsonValue } from "./fromJson";
import { fromUnknownValue } from "./fromUnknown";
import { AreaContentDefinitionType } from "../../components/area";

export const parse = (
  value: SectionType[] | undefined,
  isNarrowView: boolean
) => {
  let data = fromJsonValue(value);

  if (isNarrowView) {
    data = narrowOptimize(data);
  }

  return data.sort((x, y) => (x.order < y.order ? -1 : 1));
};

export const parseUnknown = async (
  value: string | undefined,
  sectionTypes: SectionDefinitionNamed,
  areaTypes: AreaContentDefinitionType<any>[],
  isNarrowView: boolean
): Promise<SectionType[]> => {
  let data = await fromUnknownValue(value as string, sectionTypes, areaTypes);

  if (isNarrowView) {
    data = narrowOptimize(data);
  }

  return data;
};

const narrowOptimize = (data: SectionType[]) =>
  data.map((x) => ({ ...x, width: 100 }));
