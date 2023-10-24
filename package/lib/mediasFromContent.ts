import { Media } from "../types";
import { SectionType } from "../components/section";
import {
  AreaContentType,
  EmbedDataType,
  MediaDataType,
} from "../components/area/types";

function uniqBy(array: any[], propertyName: string) {
  return array.filter(
    (e, i) => array.findIndex((a) => a[propertyName] === e[propertyName]) === i
  );
}
const getMedias = (content?: SectionType[]) => {
  if (!content) return [];

  const medias = getMediasFromJson(content);

  return uniqBy(medias, "url");
};

export default getMedias;

const getMediasFromJson = (data: SectionType[]): Media[] => {
  return data
    .map((section) =>
      section.areas
        .filter((area) => area.contents.some((x) => x.type === "media"))
        .map((area) => {
          const mediaContent = area.contents.find(
            (x) => x.type === "media"
          ) as AreaContentType<MediaDataType>;
          if (mediaContent) {
            return {
              videoUrl: mediaContent.data.videoUrl,
              url: mediaContent.data.url,
              width: 0,
              height: 0,
              name: mediaContent.data.alt || "",
            };
          }

          const embedContent = area.contents.find(
            (x) => x.type === "embed"
          ) as AreaContentType<EmbedDataType>;
          if (embedContent) {
            return {
              videoUrl: embedContent.data.videoUrl,
              url: embedContent.data.url,
              width: 0,
              height: 0,
              name: embedContent.data.alt || "",
            };
          }

          return undefined;
        })
        .filter((x) => !!x)
        .map((x) => x!)
    )
    .flat();
};
