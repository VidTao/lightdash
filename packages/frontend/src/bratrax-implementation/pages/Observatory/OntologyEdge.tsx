import { BaseEdge, getSimpleBezierPath, type EdgeProps } from '@xyflow/react';
import type { FC } from 'react';
import type { OntologyEdge } from './types';

const OntologyEdgeComponent: FC<EdgeProps<OntologyEdge>> = ({
    sourceX,
    sourceY,
    targetX,
    targetY,
    markerEnd,
    ...props
}) => {
    const [edgePath] = getSimpleBezierPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
    });

    return <BaseEdge {...props} path={edgePath} markerEnd={markerEnd} />;
};

export default OntologyEdgeComponent;
