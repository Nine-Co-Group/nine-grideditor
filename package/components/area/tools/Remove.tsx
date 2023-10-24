import { useIntl } from "react-intl";

import { Tool as Button } from "../../ui/Tool";
import { Icon } from "../../ui/Icon";
import { AreaContentDefinitionType, AreaType } from "../types";
import { getTypes } from "..";
import { useState } from "react";
import { RemoveConfirm } from ".";

const Remove = ({
  children,
  onRemove,
  area,
  withIcon,
  areaTypes,
  ...otherProps
}: {
  area: AreaType;
  onRemove(area: AreaType): void;
  withIcon?: boolean;
  areaTypes: AreaContentDefinitionType<any>[];
  children?: JSX.Element;
}) => {
  const { formatMessage } = useIntl();

  const [isOpen, setIsOpen] = useState(false);

  const onOk = () => {
    const types = getTypes(area.contents);

    const warnsOnRemove = areaTypes
      .filter((x) => types.includes(x.type))
      .some(
        (config) =>
          config.warnOnRemove?.(
            area.contents.find((x) => x.type === x.type)?.data
          ) === true
      );

    if (warnsOnRemove) {
      setIsOpen(true);
    } else onConfirm();
  };

  const onConfirm = () => {
    setIsOpen(false);

    area.contents.forEach((content) => {
      const areaComponentType = areaTypes.find((x) => content.type === x.type)!;
      areaComponentType.onRemove?.(content.data);
    });

    if (onRemove) onRemove(area);
  };

  const onCancel = () => setIsOpen(false);

  return (
    <>
      <RemoveConfirm isOpen={isOpen} onClose={onCancel} onOk={onConfirm} />
      <Button
        className="tool-remove"
        title={formatMessage({ id: "remove" })}
        onClick={onOk}
        {...otherProps}
      >
        {withIcon && <Icon id="remove" />}{" "}
        {children || <span>{formatMessage({ id: "remove" })}</span>}
      </Button>
    </>
  );
};

export default Remove;
