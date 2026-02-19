/**
 * Hook for fetching Observatory graph data.
 * Reads from sessionStorage (set by Workshop Builder "View in Observatory").
 */
import { useQuery } from '@tanstack/react-query';
import type { OntologyGraphData } from '../pages/Observatory/types';

async function fetchGraphFromSession(): Promise<OntologyGraphData | null> {
    const stored = sessionStorage.getItem('bratrax-graph');
    if (stored) {
        return JSON.parse(stored) as OntologyGraphData;
    }
    return null;
}

export function useOntologyGraph() {
    return useQuery({
        queryKey: ['ontology-graph'],
        queryFn: fetchGraphFromSession,
        staleTime: Infinity,
    });
}
