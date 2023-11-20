import { useCallback } from "react";
import { FormattedMessage } from "react-intl";

import { Picker, Mover, Remove, Create } from "./tools";
import Dropdown from "../Dropdown";
import { Icon } from "../ui/Icon";
import { SectionDefinitionNamed, SectionType } from "./types";

import "./Controls.css";

type Props = {
  section: SectionType;
  onCreate(sections: SectionType[]): void;
  onChange(sections: SectionType[]): void;
  onRemove(section: SectionType): void;
  designAreaMargin: number;
  areaTypes: any;
  onAreaActiveChange: any;
  sectionTypes: SectionDefinitionNamed;
  isAutoHeight: boolean;
};

const Controls = ({
  section,
  sectionTypes,
  onChange,
  onRemove,
  onCreate,
  designAreaMargin,
  areaTypes,
  onAreaActiveChange,
}: Props) => {
  const onSectionChange = useCallback(
    (section: SectionType) => onChange?.([section]),
    [onChange]
  );

  return (
    <div className="nge-section-controls">
      <Mover direction="up" section={section} onChange={onSectionChange} />
      <Dropdown className="nge-tool right">
        <Icon id="dots-vertical" />
        {Object.keys(sectionTypes).length > 1 && (
          <Picker
            section={section}
            onChange={onChange}
            sectionTypes={sectionTypes}
          />
        )}
        <Create
          sectionTypes={sectionTypes}
          onCreate={onCreate}
          designAreaMargin={designAreaMargin}
          order={section.order - 1}
          onAreaActiveChange={onAreaActiveChange}
        >
          <FormattedMessage id="add_row_above" />
        </Create>
        <Create
          onCreate={onCreate}
          sectionTypes={sectionTypes}
          designAreaMargin={designAreaMargin}
          order={section.order + 1}
          onAreaActiveChange={onAreaActiveChange}
        >
          <FormattedMessage id="add_row_below" />
        </Create>
        <Remove
          className="remove"
          as="button"
          section={section}
          onRemove={onRemove}
          areaTypes={areaTypes}
        />
      </Dropdown>
      <Mover direction="down" section={section} onChange={onSectionChange} />
    </div>
  );
};

export default Controls;
