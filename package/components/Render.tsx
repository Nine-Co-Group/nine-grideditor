import Section, { SectionDefinitionNamed, SectionType } from "./section";
import { AreaContentTypeProp } from "./area";

export type RenderProps = {
  value: SectionType[];
  narrowBreakpoint?: string;
  sectionTypes: SectionDefinitionNamed;
  areaTypes: AreaContentTypeProp<any>[];
};

export const GridRender = ({ value, sectionTypes, areaTypes }: RenderProps) => {
  return (
    <>
      {value.map((section) => (
        <Section
          key={section.id}
          section={section}
          sectionTypes={sectionTypes}
          areaTypes={areaTypes}
        />
      ))}
    </>
  );
};
