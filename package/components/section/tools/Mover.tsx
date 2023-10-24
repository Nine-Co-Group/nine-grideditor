import classNames from "classnames";
import { FormattedMessage } from "react-intl";

import { Icon } from "../../ui/Icon";

import "./Mover.scss";
import { Tool } from "../../ui/Tool";
import { SectionType } from "../types";

type Props = {
  direction: "up" | "down";
  children?: any;
  section: SectionType;
  onChange(section: SectionType): void;
};

const Mover = ({
  direction,
  children,
  section,
  onChange,
  ...otherProps
}: Props) => {
  const onClick = () => {
    const newOrder = Math.max(
      0,
      direction === "up" ? section.order - 1 : section.order + 1
    );

    const newSection = { ...section, order: newOrder };

    if (onChange) onChange(newSection);
  };

  const iconId: "arrow-down" | "arrow-up" = `arrow-${direction}` as any;

  return (
    <Tool
      className={classNames("section-tool-mover " + direction)}
      onClick={onClick}
      {...otherProps}
    >
      {children || (
        <>
          <Icon id={iconId as any} />
          <span>
            <FormattedMessage id={`move_${direction}`} />
          </span>
        </>
      )}
    </Tool>
  );
};

export default Mover;
