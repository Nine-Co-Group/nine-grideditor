import { useMemo, useRef } from "react";

import { AreaContentProps } from "../../../package/index";

import { MediaRender } from "./Label";
import { MediaDataType } from ".";

export const MediaArea = ({
  data,
  withControls,
  className,
  onBlur,
  onFocus,
  onClick,
}: AreaContentProps<MediaDataType>) => {
  const elem = useRef<any>(null);

  const media = useMemo(
    () => ({
      url: data.url,
      videoUrl: data.videoUrl,
      width: data.width,
      height: data.height,
      name: data.alt || "",
    }),
    [data.alt, data.height, data.url, data.videoUrl, data.width]
  );

  const image = media ? <MediaRender media={media} /> : null;

  return (
    <div
      className={className}
      onClick={onClick}
      onFocus={onFocus}
      onBlur={onBlur}
      ref={withControls ? elem : undefined}
    >
      {image}
    </div>
  );
};
