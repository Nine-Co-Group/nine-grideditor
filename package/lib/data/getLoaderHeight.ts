import { SectionType } from '../../components/section';

export const getLoaderHeight = (value: string | SectionType[] | undefined) => {
  let height = window.innerWidth * 0.25;
  if (Array.isArray(value)) height = value.length * 1000;
  else if (!!value) {
    if (value.startsWith('[')) {
      try {
        height = JSON.parse(value).length * 1000;
      } catch (error) {
        height = value.length;
      }
    } else height = value.length;
  }

  return height;
};
