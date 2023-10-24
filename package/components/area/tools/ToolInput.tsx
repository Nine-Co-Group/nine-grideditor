import { useIntl } from "react-intl";
import { toHex } from "../../../lib/color";
import { Input } from "../../ui/Input";

export type ToolInputProps = {
  max?: number;
  min?: number;
  step?: number;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  data: any;
  onChange(data: any): void;
  onKeyDown?(event: any): void;
  onBlur?(event: any): void;
  autoFocus?: boolean;
  errorMessage?: string;
};

interface InternalProps extends ToolInputProps {
  label: string;
  name: string;
  type: string;
}

export const ToolInput = ({
  name,
  label,
  max,
  min,
  disabled,
  type,
  data,
  onChange: _onChange,
  placeholder,
  ...otherProps
}: InternalProps) => {
  const { formatMessage } = useIntl();

  const onChange = (e: any) => {
    const isNumber = type === "range" || type === "number";
    const value = isNumber ? parseInt(e.target.value, 10) : e.target.value;

    const newData = {
      [name]: value,
    };

    _onChange(newData);
  };

  const value = data[name] || "";

  const translated = formatMessage({ id: label || name });

  return (
    <>
      <Input
        placeholder={placeholder || `${translated}...`}
        label={translated}
        labelClassName={name + "-label"}
        className={`${name}`}
        value={type === "color" && !!value ? "#" + toHex(value) || "" : value}
        type={type}
        onChange={onChange}
        min={min}
        max={max}
        disabled={disabled}
        {...otherProps}
      />
    </>
  );
};
