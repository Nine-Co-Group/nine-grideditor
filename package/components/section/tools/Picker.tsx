import { useMemo } from "react";
import classNames from "classnames";
import { Tool as Button } from "../../ui/Tool";
import { create as createSection } from "../helpers";
import { SectionDefinitionNamed, SectionType } from "../types";

import "./Picker.css";

const SectionPicker = ({
  className,
  onChange: _onChange,
  section,
  sectionTypes,
}: {
  section: SectionType;
  onChange(sections: SectionType[]): void;
  className?: string;
  sectionTypes: SectionDefinitionNamed;
}) => {
  const typesArray = useMemo(() => Object.entries(sectionTypes), []);

  const onChange = (type: string) => {
    const newSection = {
      ...section,
      ...createSection(
        type,
        sectionTypes[type]!,
        section.order,
        section.data.margin,
        section.areas
      ),
      id: section.id,
    };

    if (_onChange) _onChange([newSection]);
  };

  if (typesArray.length < 2) return null;

  return (
    <div className={classNames("section-tool-picker", className)}>
      {typesArray.map(([name, type]) => {
        let offset = 0;

        const width = 100; //type.width || 100;
        const height = type.height; //Math.min(60, type.height) : 60;

        const paddingTop = parseFloat(
          (height * (width / 100)).toString()
        ).toFixed(4);

        return (
          <Button
            key={name}
            type="radio"
            className={`section ${name}`}
            checked={name === section.type}
            onChange={() => onChange(name)}
          >
            <div
              className="section-content"
              style={{
                paddingTop: paddingTop + "%",
                width: width + "%",
              }}
            >
              {type.areas.map((area, i: number) => {
                const dom = (
                  <span
                    key={i}
                    className="area-icon is-top"
                    style={{
                      width: area.width + "%",
                      //   padding: margin + "%",
                      left: offset + "%",
                      height: "100%",
                    }}
                  />
                );

                offset += area.width;
                // index++;
                return dom;
              })}
            </div>
          </Button>
        );
      })}
    </div>
  );
};

export default SectionPicker;
