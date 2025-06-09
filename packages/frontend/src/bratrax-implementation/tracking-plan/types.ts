export interface Property {
    id: string
    name: string
    description: string
    type?: string
    source?: string
    isSelected: boolean
}

export interface StandardEvent {
    id: string
    name: string
    description: string
    properties: Property[]
}



