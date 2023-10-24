import heic2any from "heic2any";
import {
  AreaContentDefinitionType,
  MediaDataType as GridMediaDataType,
} from "../../../package/index";

export { MediaArea } from "./Media";
export { MediaLabel } from "./Label";

export type MediaDataType = GridMediaDataType;

export const mediaType: AreaContentDefinitionType<MediaDataType> = {
  type: "media",
  contentType: "media",
  create: () => ({
    url: undefined,
    videoUrl: undefined, //When we have a "living image"
    alt: undefined,
    width: 0,
    height: 0,
  }),
  onFiles: (files) => {
    const newMedias = [...files].map(async (x) => {
      try {
        if (isAccepted(x.type)) {
          const url = await toPreview(x);
          const { width, height } = await getDimensions(url, x.type);
          const media: MediaDataType = {
            url: x.type.startsWith("video/") ? undefined : url,
            videoUrl: !x.type.startsWith("video/") ? undefined : url,
            width,
            height,
          };
          return media;
        }
      } catch (e) {
        console.warn("Drop failed", e);
        return undefined;
      }
      return undefined;
    });

    return Promise.all(newMedias).then(
      (x) => x.filter((x) => !!x).map((x) => x!) //Remove failed
    );
  },
};

const accepts = [
  "image/*",
  "image/apng",
  "image/avif",
  "image/webp",
  "image/heic",
  "video/*",
  "video/webm",
  "video/av1",
];

const isAccepted = (type: string) =>
  !!accepts.length &&
  (!type || accepts.some((y) => type.startsWith(y.replace("*", ""))));

const getDimensions = (url: string, type: string) => {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    if (type.startsWith("image/")) {
      const media = document.createElement("img");
      media.onload = () => {
        resolve({
          width: media.naturalWidth,
          height: media.naturalHeight,
        });
      };
      media.onerror = (e: any) => {
        reject(e);
      };

      media.src = url;
    } else if (type.startsWith("video/")) {
      const media = document.createElement("video");
      media.onloadedmetadata = () => {
        resolve({
          width: media.videoWidth,
          height: media.videoHeight,
        });
      };
      media.onerror = (e: any) => {
        reject(e);
      };

      media.src = url;
    } else {
      reject("Unknown media type");
    }
  });
};

function isHEIC(file: File) {
  // check file extension since windows returns blank mime for heic
  const x = file.type
    ? file.type.split("image/").pop()
    : file.name.split(".").pop()?.toLowerCase();
  return x == "heic" || x == "heif";
}

const toPreview = async (file: File) => {
  //if HEIC file
  if (isHEIC(file)) {
    // get image as blob url
    const blobURL = URL.createObjectURL(file);

    // convert "fetch" the new blob url
    const blobRes = await fetch(blobURL);

    // convert response to blob
    const blob = await blobRes.blob();

    // convert to PNG - response is blob
    const conversionResult = await heic2any({ blob });

    // convert to blob url
    return URL.createObjectURL(
      Array.isArray(conversionResult) ? conversionResult[0]! : conversionResult
    );
  }
  return URL.createObjectURL(file);
};
