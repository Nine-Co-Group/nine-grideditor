import classNames from "classnames";
import { FormattedMessage } from "react-intl";
import { Icon } from "../../ui/Icon";
import { create as createSection } from "../helpers";

import { SectionDefinitionNamed, SectionType } from "../types";
import { AreaType } from "../../area";
import { Tool } from "../../ui/Tool";

export type Props = Omit<
  React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >,
  "type"
> & {
  sectionTypes: SectionDefinitionNamed;
  className?: string;
  type?: string;
  order: number;
  designAreaMargin: number;
  onCreate(sections: SectionType[]): void;
  onAreaActiveChange(area: AreaType, isActive: boolean): void;
};

const SectionCreate = ({
  children,
  onCreate,
  onAreaActiveChange,
  className,
  designAreaMargin,
  type,
  sectionTypes,
  order,
  ...otherProps
}: Props) => {
  const onClick = () => {
    const newSectionType = Object.keys(sectionTypes)[0]!;
    const newSection = {
      ...createSection(
        type || newSectionType,
        sectionTypes[type || newSectionType]!,
        order,
        designAreaMargin
      ),
    };

    if (onCreate) onCreate([newSection]);
    if (onAreaActiveChange) {
      //Run this after document click has bubbled
      setTimeout(() => {
        onAreaActiveChange(newSection.areas[0]!, true);
      }, 1);
    }
  };

  return (
    <Tool
      className={classNames("section-tool-create", className)}
      onClickCapture={onClick}
      type="button"
      {...otherProps}
    >
      {children || (
        <>
          <Icon id={`add`} />
          <FormattedMessage id="create" />
        </>
      )}
    </Tool>
  );
};

export default SectionCreate;
