import { useState } from "react";
import classNames from "classnames";
import { useThrottledCallback } from "use-debounce";
import { CoordinateType } from "../../../types";

import "./Resizer.css";

type Props = {
  onResize(changePx: CoordinateType, position: string): void;
  onResizeEnd(): void;
  position: "top" | "left" | "right" | "bottom" | "bottomright" | "bottomleft";
};

const Resizer = ({ position, onResize, onResizeEnd, ...otherProps }: Props) => {
  const [dragging, setDragging] = useState(false);
  const [startPosition, setStartPosition] = useState<CoordinateType>({
    x: 0,
    y: 0,
  });

  const onKeyDown = (e: any) => {
    const isArrowKey = e.keyCode >= 37 && e.keyCode <= 40;

    if (isArrowKey) {
      e.preventDefault();

      if (!dragging) {
        setDragging(true);
        setStartPosition({
          x: 0,
          y: 0,
        });
        return;
      }

      const changeFactor = 5;
      if (e.keyCode === 38) {
        //Up arrow
        if (position.includes("top") || position.includes("bottom")) {
          startPosition.y += -changeFactor;
          if (position.includes("left") || position.includes("right"))
            startPosition.x += -changeFactor;
        }
      }
      if (e.keyCode === 40) {
        //Down arrow
        if (position.includes("bottom") || position.includes("top")) {
          startPosition.y += changeFactor;
          if (position.includes("left") || position.includes("right"))
            startPosition.x += changeFactor;
        }
      }
      if (e.keyCode === 37) {
        //Left arrow
        if (position.includes("left") || position.includes("right")) {
          startPosition.x += -changeFactor;
          if (position.includes("bottom") || position.includes("top"))
            startPosition.y += -changeFactor;
        }
      }
      if (e.keyCode === 39) {
        //Right arrow
        if (position.includes("right") || position.includes("left")) {
          startPosition.x += changeFactor;
          if (position.includes("bottom") || position.includes("top"))
            startPosition.y += changeFactor;
        }
      }

      setStartPosition(startPosition);

      if (startPosition.x !== 0 || startPosition.y !== 0) {
        onResize(startPosition, position);
      }
    }
  };

  const onKeyUp = () => {
    setDragging(false);
    setStartPosition({ x: 0, y: 0 });

    onResizeEnd();
  };

  const onPoinerDown = (e: any) => {
    e.preventDefault();
    window.addEventListener("pointermove", onPointerMove, {
      passive: true,
    });
    window.addEventListener("pointerup", onPointerUp, {
      passive: true,
    });
    window.addEventListener("pointercancel", onPointerUp, {
      passive: true,
    });

    const startPosition = {
      x: e.clientX,
      y: e.clientY,
    };

    setDragging(true);
    setStartPosition(startPosition);
  };

  const onPointerUp = () => {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);

    setDragging(false);
    setStartPosition({ x: 0, y: 0 });
    onResizeEnd();
  };

  const onPointerMove = (e: any) => {
    // e.preventDefault(); no can do on passive event (and this should be passive)
    onPointerMoveThrottle(e.clientY, e.clientX);
  };

  const onPointerMoveThrottle = useThrottledCallback((clientY, clientX) => {
    if (!startPosition) return;

    const newPosition = {
      x: clientX,
      y: clientY,
    };

    const changePx: CoordinateType = {
      x:
        position.includes("left") || position.includes("right")
          ? newPosition.x - startPosition.x
          : 0,
      y:
        position.includes("top") || position.includes("bottom")
          ? newPosition.y - startPosition.y
          : 0,
    };

    onResize(changePx, position);
  }, 25);

  return (
    <button
      type="button"
      className={classNames(`nge-area-resizer resize${position}`, {
        active: dragging,
      })}
      style={{ touchAction: "none" }}
      touch-action="none"
      {...otherProps}
      onPointerDown={onPoinerDown}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      tabIndex={0}
      title={position}
    >
      <span />
    </button>
  );
};

export default Resizer;
