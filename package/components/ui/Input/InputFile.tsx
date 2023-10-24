import { ChangeEvent, useRef, useState } from "react";
import classNames from "classnames";
import { Props as InputProps } from "./BaseInput";
import InputModal from "./InputModal";

function isHEIC(file: File) {
  // check file extension since windows returns blank mime for heic
  const x = file.type
    ? file.type.split("image/").pop()
    : file.name.split(".").pop()?.toLowerCase();
  return x == "heic" || x == "heif";
}

export type Props = Omit<InputProps, "onChange"> & {
  onChange?(e: ChangeEvent<HTMLInputElement>, files: File[]): void;
};

type FileResult = {
  file: File;
  error?: string;
};

export const isAccepted = (accepts: string[], type: string) =>
  !!accepts.length &&
  (!type || accepts.some((y) => type.startsWith(y.replace("*", ""))));

const InputFile = ({
  className,
  accept,
  multiple,
  children,
  capture,
  name,
  onChange: _onChange,
  disabled,
  style,
}: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [invalid, setInvalid] = useState<FileResult[]>([]);
  const [invalidModalIsOpen, setInvalidModalIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const fileElem = useRef<HTMLInputElement>(null);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation(); //Strange things with Proxy happens without this

    const fileList = e.target.files;

    setInvalid([]);

    if (!fileList) return;

    const files = [...fileList];
    setIsLoading(true);

    const accepts = accept?.split(",") || [];
    const filesValidated: FileResult[] = files.map((original, i) => {
      let x = original;
      //Stupid as browsers dont set type for HEIC for some reason
      if (isHEIC(x) && !x.type)
        x = new File([x], x.name, { type: "image/heic" });

      //Some browser dont prevent selecting multiple files when using multiple attribute
      if (i > 0 && !multiple) return { file: x, error: "to_many" };

      //Some browser dont filter out files when using accept attribute
      if (isAccepted(accepts, x.type)) return { file: x };
      else return { file: x, error: "invalid_format" };
    });

    const valid = filesValidated.filter((x) => !x.error);
    const invalid = filesValidated.filter((x) => !!x.error);

    setInvalid(invalid);

    if (invalid.length > 0) setInvalidModalIsOpen(true);

    if (valid.length > 0 && !!_onChange)
      _onChange(
        e,
        valid.map((x) => x.file)
      );

    setIsLoading(false);

    // this line right below will reset the
    // input field so if you removed it you can re-add the same file
    e.target.value = "";
  };

  const onFocus = () => setIsFocused(true);

  const onBlur = () => setIsFocused(false);

  const hideDialog = () => setInvalidModalIsOpen(false);

  return (
    <>
      <InputModal
        isOpen={invalidModalIsOpen}
        onClose={hideDialog}
        invalid={invalid}
        accept={accept}
        multiple={multiple}
      />
      <label
        className={classNames(
          "upload-action",
          {
            focus: isFocused,
            loading: isLoading,
            disabled: disabled,
          },
          className
        )}
        style={{ ...style, position: "relative" }}
      >
        {children}
        <input
          accept={accept}
          name={name}
          capture={capture}
          multiple={multiple}
          type="file"
          ref={fileElem}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          disabled={disabled}
          style={{
            opacity: 0,
            width: "100%",
            height: "100%",
            position: "absolute",
            left: 0,
            top: 0,
            zIndex: 1,
          }}
        />
      </label>
    </>
  );
};

export default InputFile;
