import { Box, Table } from '@mantine/core';
import SelectionCheckbox from './SelectionCheckbox';
import { Property } from './types'; // You might need to create this types file

interface PropertiesListProps {
    properties: Property[];
    selectedProperties: Property[];
    eventId: string;
    onPropertySelect: (eventId: string, propertyId: string) => void;
}

const PropertiesList = ({
    properties,
    selectedProperties,
    eventId,
    onPropertySelect,
}: PropertiesListProps) => {
    return (
        <Box
            pt="md"
            sx={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}
        >
            <Table striped highlightOnHover>
                <thead>
                    <tr>
                        <th style={{ width: 40 }}>{/* Checkbox column */}</th>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Type</th>
                    </tr>
                </thead>
                <tbody>
                    {properties.map((property) => (
                        <tr
                            key={property.id}
                            onClick={() =>
                                onPropertySelect(eventId, property.id)
                            }
                            style={{ cursor: 'pointer' }}
                        >
                            <td>
                                <SelectionCheckbox
                                    checked={
                                        selectedProperties.find(
                                            (p) => p.id === property.id,
                                        )?.isSelected ?? false
                                    }
                                    onChange={() =>
                                        onPropertySelect(eventId, property.id)
                                    }
                                />
                            </td>
                            <td>{property.name}</td>
                            <td>{property.description}</td>
                            <td>{property.type}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </Box>
    );
};

export default PropertiesList;
