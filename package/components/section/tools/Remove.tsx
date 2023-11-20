import classNames from "classnames";
import { FormattedMessage } from "react-intl";

import { Tool } from "../../ui/Tool";

import { SectionType } from "../types";
import { AreaContentDefinitionType } from "../../area";

type Props = {
  as?: string;
  section: SectionType;
  onRemove(area: SectionType): void;
  areaTypes: AreaContentDefinitionType<any>[];
  className?: string;
  children?: JSX.Element;
};

const SectionRemove = ({
  children,
  section,
  onRemove,
  areaTypes,
  className,
  ...otherProps
}: Props) => {
  const onOk = () => {
    section.areas.forEach((x) => {
      x.contents.forEach((content) => {
        const areaComponentType = areaTypes.find(
          (x) => content.type === x.type
        )!;
        areaComponentType.onRemove?.(content.data);
      });
    });

    if (onRemove) onRemove(section);
  };

  return (
    <>
      <Tool
        className={classNames("nge-section-tool-remove", className)}
        onClick={onOk}
        {...otherProps}
      >
        {children || (
          <>
            {/* <Icon id={`remove`} /> */}
            <FormattedMessage id="remove" />
          </>
        )}
      </Tool>
    </>
  );
};

export default SectionRemove;
