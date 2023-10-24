import { useState, useLayoutEffect } from "react";
// import parse, { domToReact } from "html-react-parser";

// import Link from "../../../global/Link";
import { AreaContentProps } from "../../../package/index";
import { TextDataType } from ".";

export const TextArea = ({
  className,
  withControls,
  data,
  isActive,
  isTyping,
  onBlur,
  onFocus,
  onClick,
  onTypeChange,
}: AreaContentProps<TextDataType>) => {
  const [src, setSrc] = useState<string | undefined>(data.src || "<p></p>");
  useLayoutEffect(() => {
    if (isTyping) return;
    setSrc((x) => (x !== data.src ? data.src || undefined : x));
  }, [isTyping, data.src]);

  const autoFocus = isActive;

  // const parserOptions: any = useMemo(
  //   () => ({
  //     replace: ({ name, attribs, children }: any) => {
  //       if (name !== "a") return;

  //       return (
  //         <Link {...attribs} style={{}} rel={"nofollow"}>
  //           {domToReact(children, parserOptions)}
  //         </Link>
  //       );
  //     },
  //   }),
  //   []
  // );

  if (withControls) {
    return (
      <div
        contentEditable
        // readOnly={!isActive}
        className={className}
        autoFocus={autoFocus}
        onClick={onClick}
        onFocus={onFocus}
        onBlur={onBlur}
        // withLineBreaks
        onInput={(e) => {
          const src = e.currentTarget.innerHTML.replace(/&nbsp;/g, " ").trim();
          let santizied = src;

          if (!!santizied && !santizied.startsWith("<p")) {
            if (santizied.includes("<p>"))
              santizied = "<p>" + santizied.replace("<p>", "</p><p>");
            else santizied = "<p>" + santizied + "</p>";
          }

          console.log(santizied);

          onTypeChange({ src: santizied });
        }}
        dangerouslySetInnerHTML={
          typeof src === "string" ? { __html: src } : undefined
        }
      >
        {typeof src === "string" ? undefined : src}
      </div>
    );
  }
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: src || "" }}
    />
  );
};
