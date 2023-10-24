export const isVariableExpression = (input: string | undefined) => {
  if (!input) return false;

  if (input.trim().startsWith("var(")) return true;

  return false;
};

export const colorIsGrayscale = (input: string | undefined) => {
  if (!input) return false;

  const { value } = parse(input);

  if (!value) return false;

  if (Object.values(value).every((x) => x === value!.r)) return true;

  return false;
};

export const toHex = (input: string | undefined): string | undefined => {
  if (!input) return undefined;

  const { value } = parse(input);

  if (!value) return undefined;

  return RGBToHex(value);
};

const parse = (input: string | undefined) => {
  let value: Rgb | undefined = undefined; // HexToHSB("ffffff");
  let alpha = 1;

  if (input) {
    input = normalize(input);

    if (input === "transparent") {
      alpha = 0;
    } else if (input.trim().startsWith("#")) {
      value = HexToRGB(input.replace("#", ""));
    } else if (input.trim().startsWith("rgb")) {
      const parts = input
        .split(",")
        .map((x) =>
          x
            .replace("rgb(", "")
            .replace("rgba(", "")
            .replace(")", "")
            .replace(" ", "")
        );
      value = {
        r: parseInt(parts[0] || "0", 10),
        g: parseInt(parts[1] || "0", 10),
        b: parseInt(parts[2] || "0", 10),
      };

      if (parts[3]) {
        alpha = parseFloat(parts[3]);
      }
    }
  }

  return { value, alpha };
};
type Rgb = {
  r: number;
  g: number;
  b: number;
};

const HexToRGB = (hex: string) => {
  const hexNumber = parseInt(
    hex.indexOf("#") > -1 ? hex.substring(1) : hex,
    16
  );
  return {
    r: hexNumber >> 16,
    g: (hexNumber & 0x00ff00) >> 8,
    b: hexNumber & 0x0000ff,
  };
};

const RGBToHex = (rgb: Rgb) => {
  const hex = [rgb.r.toString(16), rgb.g.toString(16), rgb.b.toString(16)].map(
    (x) => (x.length === 1 ? "0" + x : x)
  );

  return hex.join("");
};

// Converts css colors "white" etc. to hex/rgb
const normalize = (str: string) => {
  const ctx = document.createElement("canvas").getContext("2d");
  if (ctx) {
    ctx.fillStyle = str;
    return ctx?.fillStyle;
  }
  return str;
};
