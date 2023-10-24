import classNames from "classnames";
import { useEffect, useState } from "react";
import ReactModal from "react-modal";

import "./Modal.css";

ReactModal.setAppElement("#root");

export type ModalProps = {
  className?: string;
  isOpen: boolean;
  children?: any;
  contentLabel: string;
  onClose(): void;
};

export const Modal = ({
  className: _className,
  onClose,
  children,
  ...otherProps
}: ModalProps) => {
  const [isOpen, setIsOpen] = useState(otherProps.isOpen);

  useEffect(() => {
    setTimeout(() => setIsOpen(otherProps.isOpen), 300);
  }, [otherProps.isOpen]);

  const someIsOpen = otherProps.isOpen || isOpen;

  const className = _className ? "popup " + _className : "popup";

  const firstClassName = className ? className.split(" ")[0] : "";

  return (
    <ReactModal
      style={{
        overlay: {},
      }}
      portalClassName={classNames(className, {
        hidden: !otherProps.isOpen,
        transition: isOpen !== otherProps.isOpen,
      })}
      className={{
        base: `${firstClassName}-container`,
        afterOpen: " ",
        beforeClose: " ",
      }}
      overlayClassName={{
        base: " ",
        afterOpen: " ",
        beforeClose: " ",
      }}
      onRequestClose={onClose}
      {...otherProps}
      isOpen={someIsOpen}
    >
      {children}
    </ReactModal>
  );
};
