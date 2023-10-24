import {
  useRef,
  useState,
  useMemo,
  useCallback,
  forwardRef,
  useLayoutEffect,
  HTMLInputTypeAttribute,
} from "react";
import classNames from "classnames";
import { Icon, IconId } from "../Icon";
import { useDebouncedCallback } from "use-debounce";
import { mergeRefs } from "../../../lib/mergeRefs";
// import Loader from "../../../Loader";

const isDomain = (string: string) =>
  /[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+/.test(
    string.trim()
  );

const dateParse = (value: string) => {
  if (value.includes("Z") || value.includes("+")) return new Date(value);

  //Safari is unable to convert a date string in the format 2019-12-01T10:10:10.951 into
  // a Date object without screwing with it (timezone is treated as UTC).
  //The solution is to reformat to 2019/12/01 10:10:10 which it treats as local time
  if (value.includes("T")) {
    let formatted = value.replace(/-/g, "/").replace("T", " ");
    if (formatted.includes(".")) formatted = formatted.slice(0, 19);
    return new Date(formatted);
  }

  return new Date(value);
};

const ios =
  !!window.navigator.userAgent.toLowerCase().match(/(ipod|iphone)/) &&
  !window.navigator.userAgent.toLowerCase().match(/(iemobile)/) &&
  !window.navigator.userAgent.toLowerCase().match(/(edge\/)/);

export type Props = Omit<
  React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >,
  "ref" | "value" | "defaultValue" | "min" | "max"
> &
  Omit<
    React.DetailedHTMLProps<
      React.SelectHTMLAttributes<HTMLSelectElement>,
      HTMLSelectElement
    >,
    "ref" | "value" | "defaultValue"
  > & {
    value?: string | number | Date | readonly string[];
    defaultValue?: string | number | Date | readonly string[];
    max?: Date | number | string | undefined;
    min?: Date | number | string | undefined;
    onValidate?(value: string): Promise<string | undefined>;
    options?: InputOption[];
    suggestions?: InputOption[];
    errorMessage?: string;
    label?: JSX.Element | string | number;
    labelClassName?: string;
    iconId?: IconId;
    actions?: JSX.Element;
    loading?: boolean;
  };

type InputOption = {
  value: string | number | undefined;
  content?: string | number;
  disabled?: boolean;
};

const getValueAttribute = (
  value: string | number | Date | readonly string[] | undefined,
  type: HTMLInputTypeAttribute | undefined
): string | undefined => {
  if (type === "select" && value === undefined) return "";

  if (value === undefined) return undefined;

  if (!type) return value.toString();

  if (type === "month") {
    const date =
      value instanceof Date ? value : dateParse(value.toString() + "-01");
    value =
      date.getFullYear().toString() +
      "-" +
      ((date.getMonth() + 1 < 10 ? "0" : "") +
        (date.getMonth() + 1).toString());
  }

  const isDate = type === "date" || type === "datetime-local";
  const isTime = type === "time" || type === "datetime-local";

  if (isDate || isTime) {
    if (!isNaN(Date.parse(value as any))) {
      const date = value instanceof Date ? value : dateParse(value.toString());

      //Convert iso dates to HTML compatible date
      let newValue = "";
      if (isDate)
        newValue +=
          date.getFullYear().toString() +
          "-" +
          ((date.getMonth() + 1 < 10 ? "0" : "") +
            (date.getMonth() + 1).toString()) +
          "-" +
          ((date.getDate() < 10 ? "0" : "") + date.getDate().toString());
      if (isTime) {
        if (isDate) newValue += "T";
        newValue +=
          (date.getHours() < 10 ? "0" : "") +
          date.getHours().toString() +
          ":" +
          ((date.getMinutes() < 10 ? "0" : "") + date.getMinutes().toString());
      }

      value = newValue;
    } else value = ""; //Invalid date
  }

  return value.toString();
};

const getMultilineHeight = (
  elem: HTMLInputElement | HTMLSelectElement | null
) => {
  if (!elem) return 0;

  const styles = getComputedStyle(elem);
  const lineHeightValue = styles.getPropertyValue("line-height");
  if (!lineHeightValue) return 0;

  const lineHeight = parseFloat(lineHeightValue);

  const oldResize = elem.style.resize;
  const oldHeight = elem.style.height;
  const oldOverflow = elem.style.overflow;

  elem.style.resize = "none";
  elem.style.height = "auto";
  elem.style.overflow = "hidden";
  elem.setAttribute("rows", "1");

  let newHeight = lineHeight;

  //If there is a scroller
  if (elem.scrollHeight > elem.offsetHeight)
    newHeight =
      lineHeight *
      Math.floor(Math.max(lineHeight, elem.scrollHeight) / lineHeight);

  newHeight +=
    parseFloat(styles.getPropertyValue("padding-top")) +
    parseFloat(styles.getPropertyValue("padding-bottom")) +
    parseFloat(styles.getPropertyValue("border-top-width")) +
    parseFloat(styles.getPropertyValue("border-bottom-width"));

  elem.style.resize = oldResize;
  elem.style.height = oldHeight;
  elem.style.overflow = oldOverflow;
  elem.removeAttribute("rows");

  return newHeight;
};

const BaseInput = forwardRef<HTMLInputElement | HTMLSelectElement, Props>(
  (
    {
      id: _id,
      type: _type,
      value: _value,
      min: _min,
      max: _max,
      style,
      defaultValue: _defaultValue,
      className,
      onClick,
      onFocus: _onFocus,
      onBlur: _onBlur,
      onKeyDown: _onKeyDown,
      onChange: _onChange,
      onInvalid: _onInvalid,
      onValidate,
      options,
      suggestions,
      errorMessage: _errorMessage,
      label,
      labelClassName,
      iconId: _iconId,
      loading,
      ...otherProps
    },
    ref
  ) => {
    const hasExternalErrorMessage = _errorMessage !== undefined;

    const type = _type || (options ? "select" : "text");
    const typeAttribute = type === "toggle" ? "checkbox" : type;

    const value = _value === null ? undefined : _value;
    const defaultValue = _defaultValue === null ? undefined : _defaultValue;

    const elem = useRef<HTMLInputElement | HTMLSelectElement>(null);

    const [focus, setFocus] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>(
      undefined
    );

    const isChecker =
      type === "checkbox" || type === "radio" || type === "toggle";

    const [hasBeenValidated, setHasBeenValidated] = useState(
      hasExternalErrorMessage
    );

    const [isMultiline, setIsMultiline] = useState(type === "textarea");
    const [multilineHeight, setMultilineHeight] = useState(
      isMultiline && !!value ? getMultilineHeight(elem.current) : 0
    );

    const withLinebreaks = isMultiline && type === "textarea";

    const enterKeyBlurs = isMultiline && !withLinebreaks;

    useLayoutEffect(() => {
      if (!elem.current) return;

      const isMultiline =
        !suggestions &&
        (type === "textarea" ||
          (getComputedStyle(elem.current).getPropertyValue("white-space") !==
            "nowrap" &&
            (type === "text" || type === "")));
      setIsMultiline(isMultiline);
    }, [type, suggestions]);

    useLayoutEffect(() => {
      if (!isMultiline) return;

      setMultilineHeight(
        isMultiline && !!value ? getMultilineHeight(elem.current) : 0
      );
    }, [isMultiline, value]);

    useLayoutEffect(() => {
      setHasBeenValidated((x) =>
        x !== hasExternalErrorMessage ? hasExternalErrorMessage : x
      );
    }, [hasExternalErrorMessage]);

    useLayoutEffect(() => {
      if (elem.current) elem.current.setCustomValidity(_errorMessage || "");
    }, [_errorMessage]);

    const validate = (elem: HTMLInputElement | HTMLSelectElement | null) => {
      setHasBeenValidated(true);

      //Clear error
      setErrorMessage(undefined);
      elem?.setCustomValidity("");
    };
    const validateDebounced = useCallback(
      async (e: any, elem: HTMLInputElement | HTMLSelectElement | null) => {
        if (!elem) return;

        //This triggers the onInvalid method below
        elem?.checkValidity();

        const hasNonCustomError =
          elem.validity.badInput ||
          elem.validity.patternMismatch ||
          elem.validity.rangeOverflow ||
          elem.validity.rangeUnderflow ||
          elem.validity.stepMismatch ||
          elem.validity.tooLong ||
          elem.validity.tooShort ||
          elem.validity.typeMismatch ||
          elem.validity.valueMissing;

        //If we have a local validation-fail, reset server validation (customValidity) and dont run it
        if (hasNonCustomError) {
          return;
        }

        if (onValidate) {
          const error = await onValidate(elem.value);

          setErrorMessage(error);
          elem.setCustomValidity(error || "");

          if (_onInvalid) _onInvalid(e);
        }
      },
      [onValidate, _onInvalid]
    );

    const onChangeDebounced = useDebouncedCallback(validateDebounced, 750);

    const onChange = (e: any) => {
      if (!isChecker) {
        const value = e.target.value as string;

        //Ignore changes when invalid date/time
        const isDate = type === "date" || type === "datetime-local";
        if (isDate && value !== "" && isNaN(Date.parse(value))) return;

        //Filter/constrain value
        let newValue = value;
        if (type === "email" || type === "url") newValue = newValue.trim();

        //Add protocol to url input
        if (type === "url") {
          if (
            isDomain(newValue) &&
            !newValue.startsWith("http") &&
            !newValue.includes(":")
          ) {
            newValue = "http://" + newValue;
          }
        }

        //Remove line breaks if line breaks are not allowed
        if (!withLinebreaks) newValue = newValue.replace(/\n/gi, "");

        const newValueAttribute = getValueAttribute(newValue, type) || "";

        if (newValueAttribute !== value) e.target.value = newValue;
      }

      validate(elem.current);

      void onChangeDebounced(e, elem.current);

      if (_onChange) _onChange(e);
    };

    const onFocus = (e: any) => {
      setFocus(true);
      if (_onFocus) _onFocus(e);
    };

    const onBlur = (e: any) => {
      setFocus(false);
      if (_onBlur) _onBlur(e);
    };

    const onKeyDown = (e: any) => {
      //Make IOS OSK keyboard dismiss when should
      if (e.key === "Enter" && enterKeyBlurs) {
        e.target.blur();
        if (_onBlur) _onBlur(e);
      }

      if (_onKeyDown) _onKeyDown(e);
    };

    const onInvalid = (e: any) => {
      e.preventDefault();

      if (!elem.current) return;

      const errorMessage = elem.current.validationMessage || undefined;

      setHasBeenValidated(true);
      setErrorMessage(errorMessage);

      if (!!errorMessage && _onInvalid) _onInvalid(e);
    };

    const id = useMemo(
      () => _id || Math.random().toString().substring(2),
      [_id]
    );

    //True if this input should be grouped/styled as a normal text-input
    const isTexted =
      type === "text" ||
      type === "textarea" ||
      type === "search" ||
      type === "tel" ||
      type === "number" ||
      type === "url" ||
      type === "email" ||
      type === "date" ||
      type === "month" ||
      type === "time" ||
      type === "datetime-local" ||
      type === "password";

    const withLabelAfter =
      type === "checkbox" || type === "radio" || type === "toggle";

    const TagName: any = options
      ? "select"
      : isMultiline && (type === "text" || type === "textarea")
      ? "textarea"
      : "input";

    const firstClassName = className ? className.split(" ")[0] : "";

    const errorMsg = hasExternalErrorMessage ? _errorMessage : errorMessage;
    const hasError = errorMsg !== undefined && hasBeenValidated;

    const iconId: IconId | undefined =
      type === "select"
        ? "arrow-down"
        : type === "date" || type === "month"
        ? "calendar"
        : type === "time" || type === "datetime-local"
        ? "clock"
        : type === "search" && !!value
        ? "remove"
        : _iconId;

    const labelElem =
      label !== undefined || otherProps.children !== undefined ? (
        <label
          onClick={(e) => {
            e.stopPropagation();
            if (onClick) onClick(e as any);
          }}
          title={withLabelAfter ? otherProps.title : undefined}
          className={
            withLabelAfter
              ? "input-control"
              : classNames(`${firstClassName}-label`, labelClassName, {
                  error: !!hasError,
                  focus: focus,
                  empty:
                    !value &&
                    value !== 0 &&
                    (!options || !options.length || !options[0]?.content),
                  placeholder: !!otherProps.placeholder,
                })
          }
          htmlFor={id}
          onPointerUp={otherProps.onPointerUp as any}
          onPointerDown={otherProps.onPointerDown as any}
          onPointerMove={otherProps.onPointerMove as any}
        >
          {label}
          {otherProps.children}
        </label>
      ) : undefined;

    return (
      <div
        className={classNames(
          `type-${type}`,
          "has-control",
          {
            error: !!hasError,
            texted: isTexted,
            focus: focus,
            checked: otherProps.checked,
            disabled: otherProps.disabled,
            readonly: otherProps.readOnly,
            ios,
            "has-icon": !!iconId,
          },
          className
        )}
        style={style}
      >
        {withLabelAfter ? undefined : labelElem}
        <TagName
          {...otherProps}
          ref={mergeRefs(elem, ref)}
          type={typeAttribute}
          id={id}
          value={getValueAttribute(value, type)}
          defaultValue={getValueAttribute(defaultValue, type)}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          onInvalid={onInvalid}
          enterKeyHint={enterKeyBlurs ? "done" : undefined}
          className={
            !withLabelAfter ? "input-control" : `input-${firstClassName}`
          }
          onClick={onClick}
          list={suggestions ? `datalist_${id}` : undefined}
          min={getValueAttribute(_min, typeAttribute)}
          max={getValueAttribute(_max, typeAttribute)}
          style={{
            height: multilineHeight ? multilineHeight.toString() + "px" : "",
          }}
        >
          {!options
            ? undefined
            : options.map(({ value, content, disabled }, i) => (
                <option
                  key={value || `empty_${i}`}
                  value={value !== undefined ? value : ""}
                  disabled={disabled}
                >
                  {content !== undefined ? content : value}
                </option>
              ))}
        </TagName>
        {withLabelAfter ? labelElem : undefined}
        {!loading && iconId && (
          <Icon id={iconId} className={`${firstClassName}-icon`} />
        )}
        {/* {loading && <Loader />} */}
        {!!hasError && <span className="input-error">{errorMsg}</span>}
        {otherProps.actions && <>{otherProps.actions}</>}

        {!!suggestions && (
          <datalist id={suggestions ? `datalist_${id}` : undefined}>
            {suggestions.map(({ value, content }, i) => (
              <option
                key={value || `empty_${i}`}
                value={value !== undefined ? value : ""}
              >
                {content}
              </option>
            ))}
          </datalist>
        )}
      </div>
    );
  }
);

export default BaseInput;
