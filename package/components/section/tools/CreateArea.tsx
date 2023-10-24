import { DragEvent, useState } from "react";
import classNames from "classnames";
import { FormattedMessage } from "react-intl";

import { create as createSection } from "../helpers";
import Create, { Props as CreateProps } from "./Create";
import {
  IncomingArea,
  IncomingContent,
  AreaContentDefinitionType,
} from "../../area";
import {
  dropResult as areaDropResult,
  addContentType as areaAddContentType,
  filesResult as areaFilesResult,
} from "../../area";
import { dragAndDrop as supportsDragAndDrop } from "../../../lib/support";
import { Icon } from "../../ui/Icon";

import "./CreateArea.css";

const CreateArea = ({
  className,
  type,
  sectionTypes,
  areaTypes,
  onAreaSwap,
  onAreaActiveChange,
  order,
  onCreate,
  designAreaMargin,
  ...otherProps
}: CreateProps & {
  areaTypes: AreaContentDefinitionType<any>[];
  onAreaSwap(area1Id: number, area2Id: number): void;
}) => {
  const [isDropping, setIsDropping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const onDragEnter = (e: any) => {
    e.preventDefault();

    setIsDropping(true);
  };

  const onDragLeave = (e: any) => {
    e.preventDefault();
    setIsDropping(false);
  };

  const onDrop = async (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();

    setIsDropping(false);
    setIsLoading(true);

    // try {
    let results: (IncomingArea | IncomingContent)[] = [];

    if (e.dataTransfer?.files?.length)
      results = await areaFilesResult([...e.dataTransfer.files], areaTypes);
    else results = [await areaDropResult(e)];

    setIsLoading(false);

    if (!results.length) return;

    for (const result of results) {
      const isIncomingArea = (result as any).areaId !== undefined;

      if (!isIncomingArea) {
        const data = result as IncomingContent;

        const newArea = areaAddContentType(
          areaTypes,
          {
            id: 0,
            width: 0,
            height: 0,
            order: 0,
            contents: [],
          },
          data.type,
          data.data
        );

        const newSection = {
          ...createSection(
            type || Object.keys(sectionTypes)[0]!,
            sectionTypes[type || Object.keys(sectionTypes)[0]!]!,
            order,
            designAreaMargin,
            [newArea]
          ),
          order: order,
        };

        onCreate([newSection]);

        //Run this after document click has bubbled
        if (results.length === 1)
          onAreaActiveChange(newSection.areas[0]!, true);
        // setTimeout(() => {
        // }, 1);
      }

      if (isIncomingArea) {
        const newSection = {
          ...createSection(
            type || Object.keys(sectionTypes)[0]!,
            sectionTypes[type || Object.keys(sectionTypes)[0]!]!,
            order,
            designAreaMargin
          ),
          order: order,
        };

        onCreate([newSection]);
        const data = result as IncomingArea;
        onAreaSwap(data.areaId, newSection.areas[0]!.id);

        return;
      }
    }
  };

  return (
    <Create
      className={classNames(
        "section-createarea",
        {
          loading: isLoading,
          dropping: isDropping,
        },
        className
      )}
      style={{
        marginTop: designAreaMargin / 2 + "rem",
        marginBottom: designAreaMargin / 2 + "rem",
      }}
      onDragEnter={onDragEnter}
      onDragOver={(e: any) => e.preventDefault()}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onAreaActiveChange={onAreaActiveChange}
      order={order}
      onCreate={onCreate}
      sectionTypes={sectionTypes}
      designAreaMargin={designAreaMargin}
      // dropzone=""
      {...otherProps}
    >
      <Icon id={`add`} />
      <span>
        <FormattedMessage
          id={
            supportsDragAndDrop() ? "dnd_here_or_press_to_add" : "press_to_add"
          }
        />
      </span>
    </Create>
  );
};

export default CreateArea;
