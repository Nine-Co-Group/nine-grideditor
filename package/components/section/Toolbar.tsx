import classNames from "classnames";
import { SectionType } from "./types";

const SectionToolbar = ({
  sections,
  className,
  sectionsActive,
  ...otherProps
}: {
  sections: SectionType[];
  className?: string;
  sectionsActive: number[];
}) => {
  return (
    <div
      className={classNames("tools tools-section", className)}
      {...otherProps}
    ></div>
  );
};

export default SectionToolbar;
