import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faArrowLeft,
  faArrowRight,
  faArrowsUpDownLeftRight,
  faChevronDown,
  faChevronUp,
  faCalendar,
  faClock,
  faCamera,
  faCode,
  faEllipsisVertical,
  faRemove,
} from "@fortawesome/free-solid-svg-icons";

import classNames from "classnames";

const icons = {
  add: faPlus,
  "arrow-left": faArrowLeft,
  "arrow-right": faArrowRight,
  "arrow-down": faChevronDown,
  "arrow-up": faChevronUp,
  calendar: faCalendar,
  cover: faArrowsUpDownLeftRight,
  clock: faClock,
  camera: faCamera,
  html: faCode,
  upload: faPlus,
  "dots-vertical": faEllipsisVertical,
  remove: faRemove,
};

export type IconId = keyof typeof icons;

type IconProps = Omit<
  React.PropsWithoutRef<
    React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLSpanElement>,
      HTMLSpanElement
    >
  >,
  "id"
> & {
  id: IconId;
  size?: "lg" | "xl" | "md" | "mlg" | "mmlg" | "sm";
  disabled?: any;
};

export const Icon = ({
  id,
  title,
  className,
  size,
  children,
  disabled,
  ...props
}: IconProps) => {
  const faIcon = (icons as any)[id];

  return (
    <span
      {...props}
      title={title}
      aria-label={title}
      className={classNames("icon", size, className, `icon-${id}`, {
        disabled: disabled,
      })}
      style={{
        width: "1.3333em",
        height: "1.3333em",
        display: "inline-flex",
        alignItems: "center",
        verticalAlign: "middle",
        background: "none",
        border: "none",
        padding: "0",
        flexShrink: "0",
      }}
    >
      <FontAwesomeIcon
        size="7x"
        icon={faIcon}
        style={{
          display: "block",
          maxHeight: "100%",
          width: "100%",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      />
      {children}
    </span>
  );
};
