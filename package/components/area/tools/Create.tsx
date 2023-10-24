import { Tool as Button } from "../../ui/Tool";

const AreaCreate = ({
  onCreate,
  withIcon,
  label,
  areaData,
  ...otherProps
}: {
  onCreate(): void;
  withIcon: boolean;
  label: any;
  type?: string;
  name?: string;
  id?: string;
  checked?: boolean;
  areaData?: object;
}) => {
  const hasType = !!otherProps.type;
  const Label = label;
  return (
    <>
      <Button
        key="button"
        onClick={hasType ? undefined : onCreate}
        onChange={!hasType ? undefined : onCreate}
        {...otherProps}
      >
        <Label withIcon={withIcon} data={areaData} />
      </Button>
    </>
  );
};

export default AreaCreate;
