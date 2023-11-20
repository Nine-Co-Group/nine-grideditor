import { useState } from "react";
import classNames from "classnames";
import { getTypes, addContentType, setContentValue } from "../helpers";
import {
  AreaContentType,
  AreaContentTypeProp,
  AreaType,
  TextDataType,
} from "../types";

import Remove from "./Remove";
import { FormattedMessage } from "react-intl";

import "./Picker.css";
import { Tool } from "../../ui/Tool";
import { Icon } from "../../ui/Icon";
import AreaCreate from "./Create";
import { stripForbiddenTags } from "../../../lib/dom";

type Props = {
  area: AreaType;
  areaTypes: AreaContentTypeProp<any>[];
  onChange(area: AreaType): void;
  className?: string;
  withEmpty: boolean;
  onRemove(area: AreaType): void;
  prefix: string;
  withIcon: boolean;
  "data-visible"?: string;
  children?: any;
  childrenLast?: any;
};

const Picker = (props: Props) => {
  const {
    area,
    className,
    withEmpty,
    onRemove,
    prefix,
    withIcon,
    children,
    areaTypes,
    childrenLast,
    "data-visible": dataVisible,
  } = props;

  const [showMore, setShowMore] = useState(false);

  const types = getTypes(area.contents);

  const onCreate = (type: string) => {
    let newarea = addContentType(areaTypes, { ...area }, type);

    if (types.length > 0) {
      const oldCType = areaTypes.find((x) => types.includes(x.type))!;
      const oldContenType = oldCType.contentType;
      const newContentType = areaTypes.find(
        (x) => x.type === type
      )!.contentType;

      if (
        (oldContenType === "html" || oldContenType === "text") &&
        (newContentType === "html" || newContentType === "text")
      ) {
        const oldData = (
          area.contents.find(
            (x) => x.type === oldCType.type
          )! as AreaContentType<TextDataType>
        ).data;

        if (newContentType === "text" && !!oldData?.src)
          newarea = setContentValue(areaTypes, newarea, type, {
            src: stripForbiddenTags(oldData.src),
          });
        if (newContentType === "html" && !!oldData?.src)
          newarea = setContentValue(areaTypes, newarea, type, {
            src: oldData.src,
          });
      }
    }

    if (props.onChange) props.onChange(newarea);
  };

  const onToggleMore = () => {
    setShowMore(!showMore);
  };

  const expandable = !!props["data-visible"];

  return (
    <ul
      className={classNames(
        "nge-area-tool-picker",
        {
          expandable,
          open: showMore,
        },
        className
      )}
      data-visible={dataVisible}
    >
      {children}
      {!!withEmpty && (
        <li>
          <Remove
            onRemove={onRemove}
            withIcon={withIcon}
            area={area}
            areaTypes={areaTypes}
          >
            <FormattedMessage id="none" />
          </Remove>
        </li>
      )}
      {areaTypes.map((config) => (
        <li key={config.type} className={config.type}>
          <AreaCreate
            type="radio"
            id={`AreaPicker_${prefix}_${area.id}_${config.type}`}
            checked={types.includes(config.type)}
            onCreate={() => onCreate(config.type)}
            withIcon={withIcon}
            label={config.label}
            areaData={area.contents.find((x) => x.type === config.type)?.data}
          />
        </li>
      ))}
      {expandable && (
        <li className="more">
          <Tool
            className="more"
            onChange={onToggleMore}
            type="checkbox"
            checked={showMore}
            name={`AreaPicker_${prefix}_${area.id}`}
            id={`AreaPicker_${prefix}_${area.id}_more`}
          >
            <Icon id="dots-vertical" />{" "}
            <span>
              <FormattedMessage id="more" />
            </span>
          </Tool>
        </li>
      )}
      {childrenLast}
    </ul>
  );
};

export default Picker;
