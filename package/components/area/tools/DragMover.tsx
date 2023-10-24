import { useRef } from "react";
import { FormattedMessage } from "react-intl";

import { Icon } from "../../ui/Icon";

import "./DragMover.scss";
import { getTypes } from "../helpers";
import { AreaType } from "../types";

type Props = {
  onDraggableChange(isDraggable: boolean): void;
  area: AreaType;
};

const DragMover = (props: Props) => {
  const elem = useRef<HTMLButtonElement>(null);

  const onPointerEnter = (e: any) => {
    if (e.target !== elem.current) return;
    props.onDraggableChange(true);
  };

  const onPointerLeave = (e: any) => {
    if (e.target !== elem.current) return;
    props.onDraggableChange(false);
  };

  const typeNames = getTypes(props.area.contents);

  if (typeNames.length === 0) return null;

  return (
    <div className="tool-dragmover">
      <FormattedMessage id="drag_to_reposition">
        {(x) => (
          //Use span to work-around drag issues with buttons in some browsers
          <button
            ref={elem}
            type="button"
            className="tool"
            title={x!.toString()}
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
          >
            <Icon id="cover" /> <FormattedMessage id="move" />
          </button>
        )}
      </FormattedMessage>
    </div>
  );
};

export default DragMover;
