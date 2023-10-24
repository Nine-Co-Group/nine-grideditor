import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import classNames from "classnames";
import { FormattedMessage } from "react-intl";
import { getTypes, setContentValue } from "./helpers";
import "./Toolbar.scss";
import { Tool } from "../ui/Tool";
import { Icon } from "../ui/Icon";
import { DimensionType } from "../../types";
import { AreaAndMetaType, AreaContentTypeProp, AreaType } from "./types";
import { AreaMeta } from "../section/types";

type Props = {
  areas: AreaAndMetaType[];
  className?: string;
  onSectionDimensionChange(areaId: number, dimensions: DimensionType): void;
  areaTypes: AreaContentTypeProp<any>[];
  onChange(area: AreaType): void;
};

const AreaContainer = ({
  areas,
  className,
  areaTypes,
  onSectionDimensionChange: _onSectionDimensionChange,
  onChange,
}: Props) => {
  const [showMore, setShowMore] = useState(false);

  const area = useMemo(() => areas[0]!.area, [areas]);
  const meta = useMemo(() => areas[0]!.meta, [areas]);

  const areaId = area.id;

  const types = useMemo(() => getTypes(area.contents), [area.contents]);

  const hasTypeAndToolbar = useMemo(
    () =>
      types.some((type) => !!areaTypes.find((x) => x.type === type)!.toolbar),
    [types, areaTypes]
  );

  const onTypeChange = useCallback(
    (type: string, dataChunk: any) => {
      const componentType = areaTypes.find((x) => x.type === type);

      const newArea = setContentValue(
        areaTypes,
        area,
        type,
        componentType!.onTypeChange?.(dataChunk) || dataChunk
      );

      onChange(newArea);
    },
    [areaTypes, area, onChange]
  );

  const onSectionDimensionChange = useCallback(
    (dimensions: DimensionType) =>
      _onSectionDimensionChange(areaId, dimensions),
    [areaId, _onSectionDimensionChange]
  );

  const onToggleMore = (e: any) => {
    e.preventDefault();
    setShowMore(!showMore);
  };

  return (
    <div
      className={classNames(
        "tools tools-area",
        { expanded: showMore },
        className
      )}
    >
      {area.contents.map((x) => (
        <TypeToolbar
          key={x.type}
          type={x.type}
          areaTypes={areaTypes}
          onChange={onTypeChange}
          areaId={area.id}
          areaMeta={meta}
          data={x.data}
          onSectionDimensionChange={onSectionDimensionChange}
        />
      ))}

      {hasTypeAndToolbar && (
        <Tool
          className="more"
          onClick={onToggleMore}
          onPointerDown={(e: any) => e.preventDefault()} //Prevent text area blur
          type="checkbox"
          checked={showMore}
        >
          <Icon id="dots-vertical" />{" "}
          <span>
            <FormattedMessage id="more" />
          </span>
        </Tool>
      )}
    </div>
  );
};

export default AreaContainer;

type TypeToolbarProps = {
  areaTypes: AreaContentTypeProp<any>[];
  type: string;
  areaId: number;
  areaWidthHeightRatioContent?: number;
  areaMeta: AreaMeta;
  data: any;
  onChange(type: string, dataChunk: any): void;
  onSectionDimensionChange(dimensions: DimensionType): void;
};

const TypeToolbar = ({
  areaTypes,
  type,
  areaId,
  areaWidthHeightRatioContent,
  areaMeta,
  data,
  onChange: _onChange,
  onSectionDimensionChange,
}: TypeToolbarProps) => {
  const componentType = useMemo(
    () => areaTypes.find((y) => y.type === type)!,
    [areaTypes, type]
  );

  const Toolbar = componentType?.toolbar;

  const onChange = useCallback(
    (data: any) => _onChange(type, data),
    [type, _onChange]
  );

  if (!Toolbar) return null;

  return (
    <Toolbar
      key={type}
      areaId={areaId}
      areaWidthHeightRatioContent={areaWidthHeightRatioContent}
      areaMeta={areaMeta}
      className={`tools tools-area-${type}`}
      data={data}
      onChange={onChange}
      onSectionDimensionChange={onSectionDimensionChange}
    />
  );
};

type AreaToolbarProps = {
  className?: string;
  children?: any;
};

export const AreaToolbar = (props: AreaToolbarProps) => {
  const { className, children } = props;

  const [visibleCount, setVisibleCount] = useState(0);
  const [hasOverflow, setHasOverflow] = useState(false);

  const elem = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!elem.current) return;

    const element = elem.current;

    const tools = Array.from(element.children) as HTMLElement[];

    setVisibleCount(0);
    setHasOverflow(false);

    let count = 0;

    const allfits = tools.every((x) => {
      if (x.offsetLeft + x.offsetWidth < element.offsetWidth - 50) {
        count++;
        return true;
      } else {
        return false;
      }
    });

    setVisibleCount(count);
    setHasOverflow(!allfits);
  }, []);

  return (
    <div
      ref={elem}
      className={classNames("tools-area-type", className, {
        measure: visibleCount === 0,
        "has-overflow": hasOverflow,
      })}
      data-visible={visibleCount}
    >
      {children}
    </div>
  );
};
