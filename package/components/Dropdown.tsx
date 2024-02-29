import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  CSSProperties,
} from "react";
import ReactDOM from "react-dom";
import classNames from "classnames";

import "./Dropdown.css";

const hasParentIfHasAnyParents = (
  element: HTMLElement,
  parentElement: HTMLElement
): boolean => {
  if (!element.parentElement) return true;

  return hasParent(element, parentElement);
};

const hasParent = (
  element: HTMLElement,
  parentElement: HTMLElement
): boolean => {
  if (element === parentElement) return true;
  else if (!element.parentElement) return false;
  else return hasParent(element.parentElement, parentElement);
};

const Container = React.forwardRef<
  HTMLDivElement,
  {
    onClose(): void;
    children?: React.ReactNode;
    style?: CSSProperties;
  }
>(({ children, style }, ref) => (
  <div className="dropdown-container" ref={ref} style={style}>
    {children}
  </div>
));

const Dropdown = ({
  tagName,
  className,
  children,
  hasOverflowParent,
  onPointerDown,
  keepOnClick,
  isOpen: _isOpen,
  onOpen: _onOpen,
  onClose: _onClose,
  disabled,
  as,
  onClick: _onClick,
  ...otherProps
}: {
  isOpen?: boolean;
  hasOverflowParent?: boolean;
  disabled?: boolean;
  onClick?(): void;
  onOpen?(): void;
  onClose?(): void;
  onPointerDown?(e: any): void;
  keepOnClick?: boolean;
  tagName?: string;
  className?: string;
  as?: string;
  children?: React.ReactNode;
  title?: string;
}) => {
  const elem = useRef<HTMLElement>(null);
  const containerElem = useRef<HTMLDivElement>(null);

  const [isOpened, setIsOpened] = useState(false);
  const [overflowAdjust, setOverflowAdjust] = useState("");

  const [rect, setRect] = useState<DOMRect | undefined>(undefined);

  const openIsInternal = _isOpen === undefined;

  const isOpen = openIsInternal ? isOpened : _isOpen;

  const labelChild: React.ReactNode | undefined =
    Array.isArray(children) && children.length > 0 ? children[0] : undefined;
  const containerChild: React.ReactNode | undefined =
    Array.isArray(children) && children.length > 1
      ? children.slice(1)
      : children;

  const TagName: any = tagName || "div";

  useEffect(() => {
    if (elem.current) {
      const rect: DOMRect = elem.current.getBoundingClientRect();
      setRect(rect);
    }

    const ResizeObserver = (window as any).ResizeObserver;

    if (!ResizeObserver) return;

    const observer = new ResizeObserver((entries: any) => {
      setRect(entries[0].contentRect);
    });
    observer.observe(elem.current);

    return () => observer.disconnect();
  }, []);

  // let timeoutInstance: NodeJS.Timeout | null = null;

  const checkOverflow = useCallback(() => {
    if (!elem.current) return;

    const droppedElem = elem.current.lastElementChild;
    if (!droppedElem) return;

    const rect = droppedElem.getBoundingClientRect();

    //Adjust dropped element position if overflowing
    if (rect.right > window.innerWidth) {
      setOverflowAdjust(`-${Math.ceil(rect.right - window.innerWidth)}`);
    }

    if (rect.left < rect.width / 2) {
      setOverflowAdjust(`${Math.ceil(rect.width / 2 - 10)}`);
    }
  }, []);

  const onOpen = useCallback(() => {
    if (openIsInternal) setIsOpened(true);
    if (_onOpen) _onOpen();
  }, [openIsInternal, _onOpen]);

  const onClose = useCallback(() => {
    if (openIsInternal) setIsOpened(false);
    if (_onClose) _onClose();
  }, [openIsInternal, _onClose]);

  useEffect(() => {
    const handleClickOutside = (e: any) => {
      if (!containerElem.current) return;

      const p = hasParentIfHasAnyParents(e.target, containerElem.current);

      if (!p) {
        if (isOpen) {
          // if (event) event.preventDefault();
          onClose();
        }
      }
    };

    document.addEventListener("click", handleClickOutside, {
      passive: true,
    });

    return () => document.removeEventListener("click", handleClickOutside);
  }, [isOpen, onClose]);

  const onClick = (e: Event) => {
    e.stopPropagation();

    if (disabled) return;

    if (_onClick) _onClick();

    checkOverflow();

    if (isOpen) {
      if (
        keepOnClick &&
        !!containerElem.current &&
        hasParentIfHasAnyParents(e.target as HTMLElement, containerElem.current)
      ) {
        return;
      }

      onClose();
    } else {
      onOpen();
    }
  };

  return (
    <TagName
      className={classNames("nge-dropdown", className, as, {
        active: isOpen,
      })}
      onClick={onClick}
      onPointerDown={onPointerDown}
      // onPointerLeave={onPointerLeave}
      ref={elem}
      tabIndex="0"
      // role="button"
      disabled={disabled}
      {...otherProps}
    >
      {labelChild}
      {!!hasOverflowParent &&
        !!rect &&
        ReactDOM.createPortal(
          <Container
            onClose={onClose}
            ref={containerElem}
            style={{
              display: isOpen ? "" : "none",
              position: "fixed",
              left: rect.left + "px",
              top: rect.bottom + "px",
              zIndex: 100,
              maxHeight: "90vh",
              overflow: "auto",
              maxWidth: "100vw",
              width: rect.width + "px",
            }}
          >
            {containerChild}
          </Container>,
          document.body
        )}
      {!hasOverflowParent && (
        <Container
          onClose={onClose}
          ref={containerElem}
          style={{ marginLeft: overflowAdjust ? `${overflowAdjust}px` : "" }}
        >
          {containerChild}
        </Container>
      )}
    </TagName>
  );
};

export default Dropdown;
