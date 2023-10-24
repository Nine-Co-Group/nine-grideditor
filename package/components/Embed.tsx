import {
  useMemo,
  useState,
  useRef,
  CSSProperties,
  useLayoutEffect,
} from "react";

import "./Embed.scss";
import classNames from "classnames";

const SOUNDCLOUD_CLIENT_ID = "ba29e0d327308d2e88f6d484f1b1fb9a";

type ComponentProps = {
  src: string;
};

const InstagramComponent = (props: ComponentProps) => {
  const { src } = props;

  useLayoutEffect(() => {
    const s = document.createElement("script");
    s.async = true;
    s.defer = true;
    s.src = "//www.instagram.com/embed.js";
    document.body.appendChild(s);

    return () => {
      if (s.parentNode) s.parentNode.removeChild(s);
    };
  }, []);

  return (
    <div
      className="embed instagram"
      dangerouslySetInnerHTML={{
        __html: src,
      }}
    ></div>
  );
};

const TwitterComponent = (props: ComponentProps) => {
  const { src } = props;

  useLayoutEffect(() => {
    const s = document.createElement("script");
    s.async = true;
    s.defer = true;
    s.src = "//platform.twitter.com/widgets.js";
    document.body.appendChild(s);

    return () => {
      if (s.parentNode) s.parentNode.removeChild(s);
    };
  }, []);

  return (
    <div
      className="embed twitter"
      dangerouslySetInnerHTML={{
        __html: src,
      }}
    ></div>
  );
};

type EmbedType = {
  name: string;
  isOfType(search: string): boolean;
  getSrc?(search: string): Promise<string | undefined>;
  component?: any;
  ratio?: number;
};

const types: EmbedType[] = [
  {
    name: "youtube",
    isOfType: (search: string) =>
      search.match("(http(s?)://)?((www|m).)?(youtube.com|youtu.be)") !== null,
    getSrc: (src: string) => {
      src = src.replace("m.", "www.");
      if (src.includes("watch?v=")) {
        src =
          src
            ?.split("&")[0]
            ?.replace("/watch?v=", "/embed/")
            .replace("m.youtube", "youtube")
            .replace("http://", "https://") || "";
      } else if (src.includes(".be/")) {
        const parts = src.split("?")[0]?.split(".be/");
        if (!!parts && parts.length >= 2)
          src = "https://www.youtube.com/embed/" + parts[1]!;
      }

      if (src.replace("://www.", "://").includes("://youtube.com"))
        src = src
          .replace("youtube.com", "youtube-nocookie.com")
          .replace("://youtube-nocookie", "://www.youtube-nocookie");
      return Promise.resolve(src);
    },
    ratio: 0.56,
  },
  {
    name: "gettyimages",
    isOfType: (search: string) =>
      search.includes("//embed.gettyimages.com/embed/"),
  },
  {
    name: "pinterest",
    isOfType: (search: string) =>
      search.includes("https://assets.pinterest.com/ext/embed.html?"),
  },
  {
    name: "spotify",
    isOfType: (search: string) =>
      search.match(
        "(http(s?)://)?((www|m).)?(spotify.com|open.spotify.com|embed.spotify.com|play.spotify.com)"
      ) !== null,
    getSrc: (src: string) => {
      if (!src.includes("https://embed.spotify.com/?uri="))
        src = "https://embed.spotify.com/?uri=" + src;
      return Promise.resolve(src);
    },
    ratio: 0.6,
  },
  {
    name: "soundcloud",
    isOfType: (search: string) =>
      search.match("(http(s?)://)?(api.soundcloud.com)") !== null,
    getSrc: (src: string) => {
      if (src.includes("https://w.soundcloud.com/player/?url"))
        return Promise.resolve(src);

      return fetch(
        "https://api.soundcloud.com/resolve?url=" +
          encodeURIComponent(src) +
          "&client_id=" +
          SOUNDCLOUD_CLIENT_ID +
          "&callback=?"
      )
        .then((r) => {
          if (!r.ok) {
            return Promise.reject(r);
          }
          return r.text();
        })
        .then((responseText) => {
          const match = responseText.match(/\?\((.*)\);/);
          if (!match || match.length < 2)
            throw new Error("invalid JSONP response");
          return JSON.parse(match[1]!);
        })
        .then((json: any) => {
          return (
            "https://w.soundcloud.com/player/?url=" +
            encodeURIComponent(json.uri) +
            "&amp;auto_play=false&amp;hide_related=false&amp;show_comments=true&amp;show_user=true&amp;show_reposts=false&amp;visual=true"
          );
        });
    },
    ratio: 0.6,
  },
  {
    name: "vimeo",
    isOfType: (search: string) =>
      search.match("(http(s?)://)?((www|m).)?(vimeo.com)") !== null,
    getSrc: (src: string) => {
      return Promise.resolve(
        "https://player.vimeo.com/video/" +
          src.split("?")[0]?.split("#")[0]?.split("/").pop()
      );
    },
    ratio: 0.56,
  },
  {
    name: "instagram",
    isOfType: (search: string) =>
      search.match("(http(s?)://)?((www|m).)?(instagram.com)/embed.js") !==
      null,
    component: InstagramComponent,
  },
  {
    name: "twitter",
    isOfType: (search: string) =>
      search.match("(http(s?)://)?platform.twitter.com/widgets.js") !== null,
    component: TwitterComponent,
  },
];

type Embed = {
  name?: string;
  url?: string;
  width: number;
  height: number;
};

export type Props = {
  allowFullScreen?: boolean;
  title?: string;
  style?: CSSProperties;
  className?: string;
  autoPlay?: boolean;
  onClick?(e: any): void;
  media: Embed;
};

const EmbedComponent = ({
  allowFullScreen,
  title,
  media,
  style,
  className,
  onClick,
}: Props) => {
  const [src, setSrc] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  const containerElem = useRef<HTMLDivElement>(null);

  const type: EmbedType | undefined = !media.url
    ? undefined
    : types.find((x) => x.isOfType(media.url!));

  useLayoutEffect(() => {
    if (!type || !media.url) return;

    const p = type.getSrc ? type.getSrc(media.url) : Promise.resolve(media.url);

    p.then((src) => {
      setSrc(src);
      setIsLoading(false);
    }).catch((err: any) => {
      if (err.statusText.toLowerCase() === "forbidden") setError("blocked");
      else setError("error");
      setIsLoading(false);
    });
  }, [type, media.url]);

  const height = useMemo(() => {
    let height = media.width
      ? Math.round((media.height / media.width) * 100)
      : undefined;
    if (!height || isNaN(height)) height = undefined;

    return (
      height || (!!type && !!type.ratio ? type.ratio * 100 : undefined) || 0
    );
  }, [media, type]);

  if (!type) return null;

  const Component = type.component;

  return (
    <div
      onClick={onClick}
      ref={containerElem}
      className={classNames("embed-container", { loading: isLoading })}
      style={{
        paddingTop: height + "%",
        height: height ? 0 : undefined,
        ...style,
      }}
    >
      {!!onClick && (
        <div
          onClick={onClick}
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            top: "0",
            left: "0",
            zIndex: 1,
          }}
        />
      )}
      {!!Component && <Component src={src} />}
      {!Component && (
        <iframe
          className={"embed " + (className ? className : "")}
          allowFullScreen={allowFullScreen}
          sandbox="allow-scripts allow-same-origin allow-popups"
          title={title || media.name}
          src={src}
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            top: "0",
            left: "0",
            backgroundColor: "transparent",
          }}
          allowTransparency={true}
        />
      )}
      {!!error && (
        <span className="loader">
          {error === "blocked" &&
            "The content creator does not allow us to show this : ("}
          {error !== "blocked" && "Source error"}
        </span>
      )}
    </div>
  );
};

export default EmbedComponent;
