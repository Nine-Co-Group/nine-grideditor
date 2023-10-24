import { useState, useRef, useEffect, useCallback, useMemo } from "react";

import classNames from "classnames";

import Toolbar from "./Toolbar";
import EditorContent from "./EditorContent";

import {
  create as sectionCreate,
  getAreaCount as sectionGetAreaCount,
  getAdjustedToAreas as sectionGetAdjustedToAreas,
  scrollToCenter as sectionScrollToCenter,
  isEmpty as sectionIsEmpty,
  SectionDefinitionNamed,
  SectionType,
} from "./section";

import {
  isEmpty as areaIsEmpty,
  create as areaCreate,
  addContentType as areaAddContentType,
  IncomingContent,
  AreaContentTypeProp,
  AreaType,
} from "./area";

import { getTopParent } from "../lib/dom";
import { MARGIN_DEFAULT, parseUnknown } from "../lib/data";
import { useDebouncedCallback } from "use-debounce";

import "./Editor.scss";

export type EditorProps = {
  value: SectionType[];
  margin?: number;
  onChange(value: SectionType[]): void;
  toolbarParentElem?: HTMLElement;
  className?: string;
  toolbarClassName?: string;
  toolbarOffset?: number;
  name?: string;
  required?: boolean;
};

// type SectionElem = {
//   id: number;
//   elem: RefObject<HTMLDivElement>;
// };

//Get all areas after a given section and area order
const getAreasAfterOrdered = (
  sections: SectionType[],
  sectionTypes: SectionDefinitionNamed,
  sectionOrder: number,
  areaOrder: number
) => {
  return sections
    .filter((x) => x.order >= sectionOrder)
    .sort((x, y) => (x.order < y.order ? -1 : 1))
    .map((section) => {
      const areaCount = sectionGetAreaCount(sectionTypes[section.type]!);

      return section.areas
        .filter(
          (area, i) =>
            i + 1 <= areaCount &&
            (section.order > sectionOrder || area.order > areaOrder) &&
            areaIsEmpty(area.contents)
        )
        .sort((x, y) => (x.order < y.order ? -1 : 1));
    })
    .flat();
};

const checkEmpty = (sections: SectionType[], areaIds: number[]) => {
  let updated = false;
  const newData = sections
    .map((x) => {
      const newSection = {
        ...x,
        areas: x.areas.map((y) => {
          if (areaIds.includes(y.id)) {
            if (areaIsEmpty(y.contents)) {
              updated = true;
              return areaCreate(y.width, y.height, y.order, x);
            }
          }
          return y;
        }),
      };

      if (
        newSection.areas.length === 1 &&
        areaIsEmpty(newSection.areas[0]!.contents)
      )
        return undefined;

      return newSection;
    })
    .filter((x) => !!x) as SectionType[];

  const newDataSorted = newData
    .sort((x, y) => (x.order < y.order ? -1 : 1))
    .reduce((data, current, i) => {
      current.order = i;
      return [...data, current];
    }, [] as SectionType[]);

  if (updated) return newDataSorted;
  return null;
};

const isEqualValues = (array1: any[], array2: any[]): boolean => {
  return (
    array1.length === array2.length &&
    array1.every((str) => array2.includes(str)) &&
    array2.every((str) => array1.includes(str))
  );
};

export const GridEditor = ({
  onChange: _onChange,
  className,
  margin = MARGIN_DEFAULT,
  toolbarClassName,
  toolbarParentElem,
  toolbarOffset = 0,
  sectionTypes,
  areaTypes,
  value,
  name,
  required,
}: EditorProps & {
  sectionTypes: SectionDefinitionNamed;
  areaTypes: AreaContentTypeProp<any>[];
}) => {
  if (!areaTypes.length) throw new Error("No types set");

  // const pointerActive = window.matchMedia("(pointer:coarse)").matches
  //   ? "coarse"
  //   : undefined;

  const [areasActive, setAreasActive] = useState<number[]>([]);
  const [areasCopied, setAreasCopied] = useState<AreaType[]>([]);
  // const [value, setValues] = useState<string | Section[]>("");

  const [toolbarHasFocus, setToolbarHasFocus] = useState<boolean>(false);
  const [isEmpty, setIsEmpty] = useState<boolean>(true);
  // const [isInvalid, setIsInvalid] = useState<boolean>(false);
  const [interacted, setInteracted] = useState(false);

  const isInvalid = isEmpty && !!required;

  const elem = useRef<HTMLDivElement>(null);
  const toolbarElem = useRef<HTMLDivElement>(null);

  const setIsEmptyDebounced = useDebouncedCallback(
    (data: SectionType[]) => setIsEmpty(!data.some((x) => !sectionIsEmpty(x))),
    500
  );

  useEffect(() => {
    setIsEmptyDebounced(value);
  }, [setIsEmptyDebounced, value]);

  const setDataFromInteraction = useCallback(
    (data: SectionType[]) => {
      _onChange(data);

      setInteracted(true);

      if (_onChange) _onChange(data);
    },
    [_onChange]
  );

  const onChange = useCallback(
    (newData: SectionType[]) => {
      setDataFromInteraction(newData);
    },
    [setDataFromInteraction]
  );

  const setAreasActiveIfChanged = useCallback((newAreasActive: number[]) => {
    setAreasActive((x) =>
      isEqualValues(x, newAreasActive) ? x : newAreasActive
    );
  }, []);

  const sectionsActive = useMemo(() => {
    if (areasActive.length > 0)
      return value
        .filter((x) => x.areas.some((y) => areasActive.includes(y.id)))
        .map((x) => x.id)
        .sort((x, y) => (x < y ? -1 : 1));
    return [];
  }, [value, areasActive]);

  const onContentsReceived = useCallback(
    (contents: (IncomingContent | AreaType)[]): SectionType[] => {
      // Promise.all(p).then(drops => {
      let sectionOrder = -1;
      let areaOrder = -1;
      let targetAreas: AreaType[] = [];

      if (areasActive.length > 0) {
        const activeAreasOrdered: AreaType[] = ([] as AreaType[]).concat.apply(
          [],
          value
            .sort((x, y) => (x.order < y.order ? -1 : 1))
            .map((section) => {
              const sectionActiveAreas = section.areas.filter((x) =>
                areasActive.includes(x.id)
              );

              if (sectionActiveAreas.length > 0) {
                if (section.order > sectionOrder) {
                  sectionOrder = section.order;
                  areaOrder = Math.max(
                    ...sectionActiveAreas.map((x) => x.order)
                  );
                }
              }

              return sectionActiveAreas.sort((x, y) =>
                x.order < y.order ? -1 : 1
              );
            })
        );

        targetAreas = targetAreas.concat(activeAreasOrdered);
      }

      const possibleAreasNotActiveOrdered = getAreasAfterOrdered(
        value,
        sectionTypes,
        sectionOrder,
        areaOrder
      );

      targetAreas = targetAreas.concat(possibleAreasNotActiveOrdered);

      //Not more areas than drops
      targetAreas = targetAreas.slice(0, contents.length);

      let changedSections: SectionType[] = [];

      while (targetAreas.length > 0) {
        const datas = contents.shift()!;
        const targetArea = targetAreas.shift()!;

        const dataIsArea = (datas as any).id !== undefined;

        let targetSection = changedSections.find((x) =>
          x.areas.some((y) => y.id === targetArea.id)
        );
        let existsInChangedSections = true;
        if (!targetSection) {
          targetSection = value.find((x) =>
            x.areas.some((y) => y.id === targetArea.id)
          );
          existsInChangedSections = false;
        }

        if (!targetSection) continue;

        let newArea: AreaType;
        if (dataIsArea) {
          const area = datas as AreaType;
          newArea = { ...targetArea, contents: area.contents };
        } else {
          const targetData = datas as IncomingContent;
          newArea = areaAddContentType(
            areaTypes,
            targetArea,
            targetData.type,
            targetData.data
          );
        }

        const newAreas = targetSection.areas.map((x) =>
          x.id === targetArea.id ? newArea : x
        );
        const newSection = sectionGetAdjustedToAreas({
          ...targetSection,
          areas: newAreas,
        });

        if (existsInChangedSections) {
          changedSections = changedSections.map((x) =>
            x.id === newSection.id ? newSection : x
          ) as SectionType[];
        } else {
          changedSections.push(newSection);
        }
      }

      const newData = value.map(
        (x) => changedSections.find((y) => y.id === x.id) || x
      );

      let sectionMaxOrder =
        newData.length > 0 ? Math.max(...newData.map((x) => x.order)) : 0;

      while (contents.length > 0) {
        const datas = contents.shift()!;

        const isArea = (datas as any).id !== undefined;

        const sectionType = Object.keys(sectionTypes)[0]!;
        const sectionDefinition = sectionTypes[sectionType]!;
        const section = sectionCreate(
          sectionType,
          sectionDefinition,
          newData.length ? sectionMaxOrder + 1 : 0,
          margin
        );

        let newArea: AreaType;
        if (isArea) {
          const area = datas as AreaType;
          newArea = areaCreate(100, 100, 0, section, area.contents);
        } else {
          const targetData = datas as IncomingContent;
          newArea = areaAddContentType(
            areaTypes,
            areaCreate(100, 100, 0, section),
            targetData.type,
            targetData.data
          );
        }

        section.areas = [newArea];

        newData.push(sectionGetAdjustedToAreas(section));

        sectionMaxOrder++;
      }

      onChange(newData);

      return newData;
    },
    [margin, areasActive, value, sectionTypes, onChange, areaTypes]
  );

  const onSomethingReceived = useCallback(
    async (datas: any[]): Promise<SectionType[]> => {
      if (!datas.length) return Promise.resolve([]);

      const p: Promise<IncomingContent[]>[] = datas
        .map((data) => {
          if (typeof data === "string") {
            return parseUnknown(data, sectionTypes, areaTypes, false).then(
              (datas: SectionType[]) => {
                const areas = datas.map((x) => x.areas).flat();
                const incoming = areas
                  .map((x) => x.contents)
                  .flat() as IncomingContent[];

                return incoming;
              }
            );
          }
          // else return areaDropToData(data, areaTypes).then((x) => [x]);
        })
        .filter((x) => !!x)
        .map((x) => x!);

      const drops = (await Promise.all(p)).flat();

      return await onContentsReceived(drops);
    },
    [onContentsReceived, sectionTypes, areaTypes]
  );

  useEffect(() => {
    const onEditorInsert = async (e: any) => {
      if (!e.detail) return;

      const datas: any[] = Array.isArray(e.detail) ? e.detail : [e.detail];

      const affectedSections = await onSomethingReceived(datas);

      setTimeout(() => {
        const lastSection = affectedSections[affectedSections.length - 1];
        if (lastSection) sectionScrollToCenter(lastSection.id);
      }, 100);
    };

    window.addEventListener("editorinsert", onEditorInsert);

    return () => window.removeEventListener("editorinsert", onEditorInsert);
  }, [onSomethingReceived]);

  useEffect(() => {
    const onDocumentKeydown = (e: any) => {
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.tagName === "SELECT" ||
        e.target.hasAttribute("contenteditable")
      ) {
        if (areasCopied.length > 0) setAreasCopied([]);
        return;
      }

      const isMac = navigator.platform.toLowerCase().includes("mac");

      if ((!isMac && e.ctrlKey) || (isMac && e.metaKey)) {
        //CTRL + C
        if (e.keyCode === 67) {
          const areasActiveNotEmpty = ([] as AreaType[]).concat.apply(
            [],
            value.map((section) =>
              section.areas.filter(
                (area) =>
                  areasActive.includes(area.id) && !areaIsEmpty(area.contents)
              )
            )
          );

          setAreasCopied([...areasActiveNotEmpty]);
          return;
        }

        //CTRL + V
        if (e.keyCode === 86) {
          if (areasCopied.length) {
            const affectedSections = onContentsReceived(areasCopied);

            const lastSection = affectedSections[affectedSections.length - 1];
            if (lastSection) sectionScrollToCenter(lastSection.id);

            return;
          }
        }
      }
    };

    document.body.addEventListener("keydown", onDocumentKeydown, {
      passive: true,
    });

    return () =>
      document.body.removeEventListener("keydown", onDocumentKeydown);
  }, [areasActive, areasCopied, value, onContentsReceived]);

  const onDocumentClick = useCallback(
    (e: Event, downTarget: Element | undefined) => {
      if (!elem.current) return;

      const target = e.target;

      if (!(target instanceof HTMLElement)) return;

      //Nothing to deactivate
      if (areasActive.length === 0) return;

      const noDeactivateElems = [toolbarElem.current];

      for (let i = 0; i < noDeactivateElems.length; i++) {
        const elem = noDeactivateElems[i];

        if (!!elem && (target === elem || elem.contains(target))) return;
      }

      //Popups, dialogs, tooltips and other things are not in the same dom-tree, don't deactivate
      const topParent = getTopParent(elem.current);
      if (!topParent.contains(target)) return;

      let remainsActive: Array<number> = [];

      if (
        elem.current.contains(target) ||
        (!!downTarget && elem.current.contains(downTarget))
      ) {
        remainsActive = areasActive.filter((x) => {
          const areaElem = document.getElementById(x.toString());

          //Area not in DOM, deactivate
          if (!areaElem) return false;

          //Clicking already active area, keep
          if (target === areaElem || areaElem.contains(target)) return true;

          //Down target already active area, keep
          if (
            !!downTarget &&
            (downTarget === areaElem || areaElem.contains(downTarget))
          )
            return true;

          //Area section
          const section = value.find((y) => y.areas.some((z) => z.id === x));

          //Section does not exist, deactivate
          if (!section) return false;

          //Area section elem
          const sectionElem = document.getElementById(section.id.toString());
          if (sectionElem) {
            const sectionControlElem = sectionElem.lastElementChild;

            //If clicking area section controls, keep
            if (
              !!sectionControlElem &&
              (sectionControlElem === target ||
                sectionControlElem.contains(target))
            )
              return true;
          }

          return false;
        });
      }

      //Remove empty areas going inactive when using mouse
      // if (pointerActive !== "coarse") {
      //   const goingInactive = areasActive.filter(
      //     (x) => !remainsActive.includes(x)
      //   );

      //   const newData = checkEmpty(sections, goingInactive);
      //   if (newData) {
      //     onChange(newData);
      //   }
      // }

      setAreasActiveIfChanged(remainsActive);
    },
    [areasActive, setAreasActiveIfChanged, value]
  );
  useEffect(() => {
    let downTarget: Element | undefined = undefined;
    const onDocumentPointerDown = (e: any) => {
      downTarget = e.target || undefined;
    };
    const onDocumentClickWithDownTarget = (e: any) => {
      onDocumentClick(e, downTarget);
      downTarget = undefined;
    };

    document.body.addEventListener("pointerdown", onDocumentPointerDown, {
      passive: true,
    });
    document.body.addEventListener("click", onDocumentClickWithDownTarget, {
      passive: true,
    });
    return () => {
      document.body.removeEventListener("pointerdown", onDocumentPointerDown);
      document.body.removeEventListener("click", onDocumentClickWithDownTarget);
    };
  }, [onDocumentClick]);

  const onAreaActiveChange = useCallback(
    (area: AreaType, isActive: boolean) => {
      let remainsActive = [];

      const elem = document.getElementById(area.id.toString());

      if (isActive) {
        const activeElem = document.activeElement;
        if (
          elem &&
          (!activeElem ||
            (!!activeElem && !activeElem.hasAttribute("contenteditable")))
        )
          elem.focus();

        const wasActive = areasActive.filter((x) => x !== area.id);

        remainsActive = [area.id];

        const newData = checkEmpty(value, wasActive);
        if (newData) onChange(newData);
      } else {
        remainsActive = areasActive.filter((x) => x !== area.id);

        if (elem) elem.blur();

        const newData = checkEmpty(value, [area.id]);
        if (newData) onChange(newData);
      }

      setAreasActiveIfChanged(remainsActive);
    },
    [value, areasActive, onChange, setAreasActiveIfChanged]
  );

  const onSectionChangeOrCreate = useCallback(
    (incomingSections: SectionType[]) => {
      const incomingSectionIds = incomingSections.map((x) => x.id);
      let newSections = value.filter((x) => !incomingSectionIds.includes(x.id));

      console.log(newSections, incomingSections);

      incomingSections.forEach((section) => {
        const old = value.find((x) => x.id === section.id);
        //Adding template
        if (!old) {
          //Move all templates order +1 where bigger than or equal
          newSections = newSections.map((x) =>
            x.order >= section.order ? { ...x, order: x.order + 1 } : x
          );

          //Add new template
          newSections.push(section);

          return;
        } else {
          newSections.push(section);

          //Check area deactivation if changing type
          if (old.type !== section.type) {
            const stayingActive = areasActive.filter((x) => {
              const area = section.areas.find((y) => y.id === x);

              return (
                !area ||
                area.order < sectionGetAreaCount(sectionTypes[section.type]!)
              );
            });
            setAreasActiveIfChanged(stayingActive);
          }

          const orderChangeFactor = section.order - old.order;

          if (orderChangeFactor) {
            const orderTemplate = value.find((x) => x.order === section.order);
            if (orderTemplate) {
              orderTemplate.order -= orderChangeFactor;

              newSections = newSections.filter(
                (x) => x.id !== orderTemplate.id
              );

              newSections.push(orderTemplate);
            }
          }
        }
      });

      onChange(newSections);
    },
    [value, onChange, areasActive, setAreasActiveIfChanged, sectionTypes]
  );

  const onSectionRemove = useCallback(
    (section: SectionType) => {
      const newData = value
        .filter((x) => x.id !== section.id)
        .sort((x, y) => (x.order < y.order ? -1 : 1))
        .reduce((data, current, i) => {
          current.order = i;
          return [...data, current];
        }, [] as SectionType[]);

      //Remove active areas if they are in section
      const sectionAreaIds = section.areas.map((x) => x.id);

      setAreasActiveIfChanged(
        areasActive.filter((x) => !sectionAreaIds.includes(x))
      );

      onChange(newData);
    },
    [value, onChange, areasActive, setAreasActiveIfChanged]
  );

  const onAreaSwap = useCallback(
    (area1Id: number, area2Id: number): void => {
      const newData = value.map((x) => {
        const isAffected = x.areas.some(
          (y) => y.id === area1Id || y.id === area2Id
        );
        if (!isAffected) return x;

        const area1 = x.areas.find((y) => y.id === area1Id);

        const area2 = x.areas.find((y) => y.id === area2Id);

        if (!area1 || !area2) return x;

        const newAreas = x.areas.map((y) => {
          if (y.id === area1.id || y.id === area2.id) {
            const newArea = y.id === area1.id ? area2 : area1;

            return { ...y, contents: [...newArea.contents] };
          }
          return y;
        });

        const newSection = {
          ...x,
          areas: newAreas,
        };

        return sectionGetAdjustedToAreas(newSection);
      });

      onChange(newData);
    },
    [value, onChange]
  );

  const onToolbarFocus = useCallback(() => {
    setToolbarHasFocus(true);
  }, []);

  const onToolbarBlur = () => {
    setToolbarHasFocus(false);
  };

  // const onInvalid = () => {
  //   setIsInvalid(true);
  // };

  return (
    <>
      <div
        ref={elem}
        className={classNames(
          "grideditor",
          {
            "toolbar-has-focus": toolbarHasFocus,
            invalid: !!isInvalid && !!interacted,
            empty: isEmpty,
          },
          className
        )}
      >
        <Toolbar
          sections={value}
          sectionTypes={sectionTypes}
          sectionsActive={sectionsActive}
          areasActive={areasActive}
          onChange={onSectionChangeOrCreate}
          parentElem={toolbarParentElem}
          areaTypes={areaTypes}
          className={toolbarClassName}
          onFocus={onToolbarFocus}
          onBlur={onToolbarBlur}
          ref={toolbarElem}
          offset={toolbarOffset}
        />
        <EditorContent
          sectionTypes={sectionTypes}
          sections={value}
          onSectionChangeOrCreate={onSectionChangeOrCreate}
          onSectionRemove={onSectionRemove}
          onAreaSwap={onAreaSwap}
          onContentsReceived={onContentsReceived}
          onSomethingReceived={onSomethingReceived}
          onAreaActiveChange={onAreaActiveChange}
          margin={margin}
          areasActive={areasActive}
          areaTypes={areaTypes}
        />
      </div>
      {!!required && (
        //We use this for form validation when needed
        <input
          className="grideditor-input"
          type="text"
          required={required}
          name={name}
          value={isEmpty ? "" : "1"}
          // onInvalid={onInvalid}
          onChange={() => {
            //We don't want to change the value
          }}
          style={{ display: "none" }}
        />
      )}
    </>
  );
};
