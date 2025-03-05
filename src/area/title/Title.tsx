import { useState, useLayoutEffect } from "react";
// import parse, { domToReact } from "html-react-parser";

// import Link from "../../../global/Link";
import { AreaContentProps } from "../../../package/index";
import { TitleDataType } from ".";
import { stripForbiddenTags } from "../../../package/lib/dom";

export const TitleArea = ({
  className,
  withControls,
  data,
  isActive,
  isTyping,
  onBlur,
  onFocus,
  onClick,
  onTypeChange,
}: AreaContentProps<TitleDataType>) => {
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
      <h2
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
          const santizied = stripForbiddenTags(src);

          onTypeChange({ src: santizied });
        }}
        dangerouslySetInnerHTML={
          typeof src === "string" ? { __html: src } : undefined
        }
      >
        {typeof src === "string" ? undefined : src}
      </h2>
    );
  }
  return (
    <h2 className={className} dangerouslySetInnerHTML={{ __html: src || "" }} />
  );
};
