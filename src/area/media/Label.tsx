import { CSSProperties } from "react";
import { AreaLabelProps, MediaDataType } from "../../../package/index";
import { Media } from "../../../package/types";

export const MediaLabel = ({ data }: AreaLabelProps<MediaDataType>) => {
  return (
    <span className="media-label">
      {!!data?.url && <MediaRender media={{ ...data, name: data.alt || "" }} />}
      Image
    </span>
  );
};

export const MediaRender = ({ media }: { media: Media }) =>
  media.videoUrl ? (
    <video
      src={media.videoUrl}
      poster={media.url}
      muted
      autoPlay
      loop
      playsInline
      style={mediaStyle}
    />
  ) : (
    <img src={media.url} style={mediaStyle} />
  );

const mediaStyle: CSSProperties = {
  objectFit: "cover",
  objectPosition: "center",
  height: "100%",
  width: "100%",
};
