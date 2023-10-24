import {
  SectionDefinition,
  SectionDefinitionNamed,
  SectionType,
} from "../../components/section";
import { calculateRatios as areaCalculateRatios } from "../../components/area";
import { AreaContentDefinitionType, AreaType } from "../../components/area";
import { DimensionType } from "../../types";
import { getId } from "../getId";
import { MARGIN_DEFAULT } from ".";

type CreateReturn = {
  sectionData: SectionType;
  areaData: AreaType;
};

const sectionDefinition: SectionDefinition = {
  height: 55,
  areas: [
    {
      width: 100,
    },
  ],
};

export const fromUnknownValue = (
  html: string,
  sectionTypes: SectionDefinitionNamed,
  areaTypes: AreaContentDefinitionType<any>[]
): Promise<SectionType[]> => {
  if (!html) return Promise.resolve([]);

  const textType =
    areaTypes.find((x) => x.contentType === "text") ||
    areaTypes.find((x) => x.contentType === "html");
  const mediaType = areaTypes.find((x) => x.contentType === "media");
  const embedType = areaTypes.find((x) => x.contentType === "embed");

  console.log(textType, mediaType, embedType);

  //If there are images or videos in insert, split the data on this
  const datas = html.split(
    /(<img[^>]*>|<video[^>]*><\/video>|<iframe[^>]*><\/iframe>)/
  );

  const p = datas
    .map((match, i) => {
      if (!match || !match.trim()) return undefined;

      const sectionData: SectionType = {
        id: getId(),
        order: i,
        type: Object.keys(sectionTypes)[0]!,
        width: 100,
        height: 0,
        data: { margin: MARGIN_DEFAULT },
        areas: [],
      };

      const areaData: AreaType = {
        id: getId(),
        order: 0,
        // types: [],
        // elem: area,
        // contentElem: areaContent,
        width: 100,
        height: 0,
        widthHeightRatio: 0,
        contents: [],
      };

      let pt: Promise<CreateReturn> | null = null;
      if (match.startsWith("<img ") || match.startsWith("<video ")) {
        if (mediaType)
          pt = createMedia(
            mediaType,
            sectionData,
            areaData,
            sectionDefinition,
            match
          );
        else pt = Promise.reject();
      } else {
        if (embedType)
          pt = createEmbed(
            embedType,
            sectionData,
            areaData,
            sectionDefinition,
            match
          );
        else pt = Promise.reject();
      }
      pt = pt.catch(() => {
        if (textType)
          return createBody(
            textType,
            sectionData,
            areaData,
            sectionDefinition,
            match
          );
        else return { sectionData, areaData };
      });

      return pt.then(({ sectionData, areaData }) => {
        sectionData.areas = [areaData];

        return sectionData;
      });
    })
    .filter((x) => !!x)
    .map((x) => x!);

  return Promise.all(p);
};

const createBody = (
  bodyType: AreaContentDefinitionType<{
    src: string | undefined;
  }>,
  sectionData: SectionType,
  areaData: AreaType,
  _sectionDefinition: SectionDefinition,
  content: string
): Promise<CreateReturn> => {
  let typedata = bodyType.create();

  if (content) {
    const trimTags = ["<br />", "<br>", "<br/>", "</a>"];
    const trimStart = ["</a>", "</p>"];
    const trimEnd = ["<a>", "<p>"];

    const someStarts = (x: string) => trimmed.trim().startsWith(x);
    const someEnds = (x: string) => trimmed.trim().endsWith(x);

    let trimmed = content;
    trimmed = trimmed.replace(/\s+/gi, " ");
    let tag = null;
    while ((tag = [...trimTags, ...trimStart].find(someStarts))) {
      trimmed = trimmed.slice(tag.length).trim();
    }
    while ((tag = [...trimTags, ...trimEnd].find(someEnds))) {
      trimmed = trimmed.slice(0, -tag.length).trim();
    }

    if (trimmed) {
      const dataChunk = { src: trimmed };
      typedata = bodyType!.onTypeChange?.(dataChunk) || dataChunk;
      if (typedata.src) {
        areaData.contents.push({
          type: bodyType.type,
          data: typedata,
        });
      }
    }
  }

  return Promise.resolve({ sectionData, areaData });
};

const createMedia = (
  mediaType: AreaContentDefinitionType<{
    src: string;
    width: number;
    height: number;
  }>,
  sectionData: SectionType,
  areaData: AreaType,
  _sectionDefinition: SectionDefinition,
  content: string
): Promise<CreateReturn> => {
  const dom = document.createElement("div");
  dom.innerHTML = content;
  const img = dom.firstElementChild as HTMLImageElement;
  if (!img || !img.src) return Promise.reject();

  const src = img.src;

  if (!mediaType.onTypeValidate?.("url", src)) return Promise.reject();

  return new Promise<DimensionType>((resolve) => {
    const image = document.createElement("img");

    if (img.width > 0 && img.height > 0) {
      resolve({ width: img.width, height: img.height });
    }

    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      resolve({ width: 0, height: 0 });
    };

    image.src = src;
  })
    .then((x) => {
      if (!x.width || !x.height) return;

      const typedata = mediaType.create();
      typedata.src = img.src;
      typedata.width = x.width;
      typedata.height = x.height;

      areaData.width = 100;
      areaData.height = 100;

      const widthFraction = 1;
      sectionData.width =
        parseFloat(parseFloat(widthFraction.toString()).toFixed(7)) * 100;
      sectionData.height =
        parseFloat(
          parseFloat(
            ((typedata.height / typedata.width) * widthFraction).toString()
          ).toFixed(7)
        ) * 100;

      const ratios = areaCalculateRatios(
        areaData.width,
        areaData.height,
        sectionData.height
      );
      areaData.widthHeightRatio = ratios.widthHeightRatio;
      areaData.widthHeightRatioContent = ratios.widthHeightRatioContent;

      areaData.contents.push({
        type: mediaType.type,
        data: typedata,
      });
    })
    .then(() => ({ sectionData, areaData }));
};

const createEmbed = (
  embedType: AreaContentDefinitionType<{
    src: string;
    width: number;
    height: number;
  }>,
  sectionData: SectionType,
  areaData: AreaType,
  _sectionDefinition: SectionDefinition,
  content: string
): Promise<CreateReturn> => {
  const dom = document.createElement("div");
  dom.innerHTML = content;
  const first = dom.firstElementChild as HTMLIFrameElement;
  const iframe = !!first && first.tagName === "IFRAME" ? first : undefined;
  const src = iframe ? iframe.src : content;

  if (!embedType.onTypeValidate?.("url", src)) return Promise.reject();

  // areaData.types = [type];
  areaData.width = 100;
  areaData.height = 100;

  const typedata = embedType.create();

  typedata.src = src;

  if (iframe) {
    if (iframe.width && iframe.height) {
      if (!iframe.width.includes("%"))
        typedata.width = parseInt(iframe.width, 10);
      if (!iframe.height.includes("%"))
        typedata.height = parseInt(iframe.height, 10);
    } else if (iframe.style.width && iframe.style.height) {
      if (!iframe.style.width.includes("%"))
        typedata.width = parseInt(iframe.style.width, 10);
      if (!iframe.style.height.includes("%"))
        typedata.height = parseInt(iframe.style.height, 10);
    }
    if (!typedata.width || !typedata.height) {
      typedata.width = 960; //Assume some size
      typedata.height = 540; //Assume some size
    }

    areaData.widthHeightRatio = typedata.width / typedata.height;
    const widthFraction = 1;
    if (widthFraction) {
      sectionData.width =
        parseFloat(parseFloat(widthFraction.toString()).toFixed(7)) * 100;
      sectionData.height =
        parseFloat(
          parseFloat(
            ((typedata.height / typedata.width) * widthFraction).toString()
          ).toFixed(7)
        ) * 100;
    }
  }

  areaData.contents.push({
    type: embedType.type,
    data: typedata,
  });

  return Promise.resolve({ sectionData: sectionData, areaData });
};
