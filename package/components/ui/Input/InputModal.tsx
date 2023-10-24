import { useMemo } from "react";
import { Modal, ModalProps } from "../";
import { FormattedMessage } from "react-intl";

type FileResult = {
  file: File;
  error?: string;
};

interface Props extends Omit<ModalProps, "contentLabel"> {
  invalid: FileResult[];
  accept?: string;
  multiple?: boolean;
}

const InputModal = ({ invalid, accept, multiple, ...otherProps }: Props) => {
  const content = useMemo(() => {
    let contentType = "file";
    if (accept) {
      if (accept.startsWith("image/")) {
        contentType = "image";
      }
      if (accept.startsWith("audio/")) {
        contentType = "audio";
      }
      if (accept.startsWith("video/")) {
        contentType = "video";
      }
    }

    let titleIsError = false;
    let title = undefined;
    if (!multiple) {
      if (invalid.length > 0) {
        const x = invalid[0];
        if (x?.error === "to_small") {
          title = <FormattedMessage id={`${contentType}_to_small`} />;
        } else if (x?.error === "to_big") {
          title = <FormattedMessage id={`${contentType}_to_big`} />;
        } else if (x?.error) {
          titleIsError = true;
          title = <FormattedMessage id={x.error} />;
        }
      }
    } else {
      title = `${contentType}s invalid`;
    }

    const content = (
      <ul>
        {invalid
          .slice(titleIsError ? 1 : 0)
          .filter((x) => x)
          .map((x, i) => (
            <li key={i}>
              <FormattedMessage id={x.error!} />
            </li>
          ))}
      </ul>
    );

    return { title, content };
  }, [invalid, accept, multiple]);

  return (
    <Modal
      contentLabel="Validation modal"
      {...otherProps}
      className="popup-input-modal"
    >
      <div className="content">
        <h1 className="heading">{content.title}</h1>
        <p className="sub-heading">{content.content}</p>
      </div>
    </Modal>
  );
};

export default InputModal;
