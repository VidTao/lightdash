import { Checkbox } from '@mantine/core';

interface SelectionCheckboxProps {
    checked: boolean;
    onChange: () => void;
}

const SelectionCheckbox = ({ checked, onChange }: SelectionCheckboxProps) => {
    return (
        <Checkbox
            checked={checked}
            onChange={onChange}
            onClick={(e) => e.stopPropagation()}
            size="sm"
        />
    );
};

export default SelectionCheckbox;
