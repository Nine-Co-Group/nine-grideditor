import * as React from "react";
import {
  GridEditor,
  GridRender,
  isUnknownValue,
  parseUnknown,
  parse,
} from "../package/index";

import { TextArea, TextLabel, textType } from "./area/text";
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
    ...mediaType,
    label: MediaLabel,
    render: MediaArea,
  },
];

const App = () => {
  const someValue = "<p>asdasdasdas</p>" || [];
  const isUnknown = isUnknownValue(someValue);

  const [valueIsLoading, setIsLoadingData] = React.useState(isUnknown);
  const [value, setValue] = React.useState<any[]>(
    isUnknown ? [] : parse(someValue as any, false)
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
      }}
    >
      {valueIsLoading && "Loading..."}
      <GridEditor
        sectionTypes={sectionTypes}
        areaTypes={areaTypes}
        value={value}
        onChange={setValue}
      />

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
