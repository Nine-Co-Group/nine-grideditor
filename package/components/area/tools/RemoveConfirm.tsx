import { FormattedMessage } from "react-intl";
import { Modal, Tool } from "../../ui";

type Props = {
  isOpen: boolean;
  onOk(): void;
  onClose(): void;
};

const RemoveConfirm = ({ isOpen, onClose, onOk }: Props) => {
  return (
    <Modal contentLabel="Confirm removal" isOpen={isOpen} onClose={onClose}>
      <h1 className="header">
        <FormattedMessage id="are_you_sure"></FormattedMessage>
      </h1>
      <div className="bottom">
        <Tool onClick={onClose}>
          <FormattedMessage id="cancel" />
        </Tool>
        <Tool onClick={onOk}>
          <FormattedMessage id="ok" />
        </Tool>
      </div>
    </Modal>
  );
};

export default RemoveConfirm;
