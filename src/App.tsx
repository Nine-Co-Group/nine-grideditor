import * as React from "react";
import {
  GridEditor,
  GridRender,
  isUnknownValue,
  parseUnknown,
  parse,
} from "../package/index";

import { TextArea, TextLabel, textType } from "./area/text";
import { TitleArea, TitleLabel, titleType } from "./area/title";
import { MediaArea, MediaLabel, mediaType } from "./area/media";
import { IntlProvider } from "react-intl";

import "./App.css";

const sectionTypes = {
  one: {
    height: (9 / 16) * 100,
    areas: [
      {
        width: 100,
      },
    ],
  },
  bunny: {
    height: (1 / 2) * 100,
    areas: [
      {
        width: 50,
      },
      {
        width: 50,
      },
    ],
  },
  jumps: {
    height: (1 / 3) * 100,
    areas: [
      {
        width: 33.33,
      },
      {
        width: 33.33,
      },
      {
        width: 33.33,
      },
    ],
  },
  around: {
    height: (1 / 4) * 100,
    areas: [
      {
        width: 25,
      },
      {
        width: 25,
      },
      {
        width: 25,
      },
      {
        width: 25,
      },
    ],
  },
};

const areaTypes = [
  {
    ...textType,
    label: TextLabel,
    render: TextArea,
  },
  {
    ...titleType,
    label: TitleLabel,
    render: TitleArea,
  },
  {
    ...mediaType,
    label: MediaLabel,
    render: MediaArea,
  },
];

console.log(areaTypes);

const html =
  "<body>\n<h1>Campaign brief for Nine Agency</h1><p><strong>Campaign:</strong>&nbsp;Nine Agency</p><p><strong>Campaign period:&nbsp;</strong>Start Date - End Date</p><p><strong>Activations:&nbsp;</strong>Influencer Partnerships</p><p><strong>Campaign goals:</strong></p><ul>    <li>        <p>Increase brand awareness through influencer partnerships' audiences.</p>    </li>    <li>        <p>Drive traffic to link in bio (specify website, landing page, etc.)</p>    </li></ul><p><strong>Brand Messaging:</strong> Nine Agency stands for innovative marketing solutions, expert insights, and exceptional customer service. Our unique selling propositions (USPs) are our data-driven strategies and tailored campaigns that meet the unique needs of our clients.</p><h2>Information about Nine Agency</h2><p><em>Our target audience should get enlightened about our comprehensive marketing services, including social media management, content creation, and performance analytics.</em></p><h2>Content requirements</h2><ul>    <li>        <p>Both influencer and Nine Agency branding must be included in the content.</p>    </li>    <li>        <p>Brand elements should be clearly visible and communicated about in the content. The branding cannot be hidden behind other objects or edited to look different from real-life perspective.</p>    </li>    <li>        <p>All content must be high quality, shot in 1920x1080p resolution or higher, and in color.</p>    </li>    <li>        <p>The influencer is responsible for creating content that follows the guidelines from the briefing. The influencer has the obligation to correct the material if info is missing/incorrect. During publishing, all content should be corrected through draft and in line with briefing. (Content should not have to be taken down)</p>    </li>    <li>        <p>Drafts must be sent to the responsible at Nine Agency for approval before publishing.</p>    </li>    <li>        <p>Content must be original and not infringe on any third-party rights (trademarks, music, etc.).</p>    </li>    <li>        <p>Content must not include political information or use private hashtags.</p>    </li>    <li>        <p>All content must be marked as Paid Partnership with @NineAgency.</p>    </li></ul></body>";

const App = () => {
  const someValue: any = React.useMemo(
    () =>
      // [] ||
      html ||
      '<p>asdasdasdas</p><h2 style="color:red">Title text goes here</h2>' ||
      [],
    [],
  );
  const isUnknown = isUnknownValue(someValue);

  const [valueIsLoading, setIsLoadingData] = React.useState(isUnknown);
  const [value, setValue] = React.useState<any[]>(
    isUnknown ? [] : parse(someValue as any, false),
  );

  React.useLayoutEffect(() => {
    if (!isUnknown) {
      setValue(parse(someValue as any, false));
    } else {
      parseUnknown(someValue, sectionTypes, areaTypes, false).then((data) => {
        console.log(data);
        setIsLoadingData(false);
        setValue(data);
      });
    }
  }, [isUnknown, someValue]);

  return (
    <IntlProvider
      locale="en"
      messages={{
        dnd_here_or_press_to_add: "Drag and drop here or press to add",
        embed: "Embed",
        upload: "Upload",
        cancel: "Cancel",
        ok: "Ok",
        remove: "Remove",
        edit: "Edit",
        move_down: "Move down",
        move_up: "Move up",
        add_row_below: "Add row below",
        add_row_above: "Add row above",
        move: "Move",
        drag_to_reposition: "Drag to reposition",
        press_to_add: "Press to add",
        are_you_sure: "Are you sure?",
      }}
    >
      {valueIsLoading && "Loading..."}
      <div style={{ padding: "1rem", border: "1px solid #ccc" }}>
        <GridEditor
          sectionTypes={sectionTypes}
          areaTypes={areaTypes}
          value={value}
          onChange={setValue}
        />
      </div>

      <pre>{JSON.stringify(value, null, 2)}</pre>
      <GridRender
        sectionTypes={sectionTypes}
        areaTypes={areaTypes}
        value={value}
      />
    </IntlProvider>
  );
};

export default App;
