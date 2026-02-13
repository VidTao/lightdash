/**
 * Hook for fetching Observatory graph data.
 * Supports two modes:
 * 1. Live: fetches from the compiler API via POST /api/v1/bratrax/graph
 * 2. Session: reads from sessionStorage (set by Workshop Builder "View in Observatory")
 */
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import type { OntologyGraphData } from '../pages/Observatory/types';

async function fetchGraphFromSession(
    client: string,
): Promise<OntologyGraphData | null> {
    const stored = sessionStorage.getItem('bratrax-graph');
    if (stored) {
        return JSON.parse(stored) as OntologyGraphData;
    }
    return null;
}

export function useOntologyGraph() {
    const [searchParams] = useSearchParams();
    const client = searchParams.get('client');

    return useQuery({
        queryKey: ['ontology-graph', client],
        queryFn: () => fetchGraphFromSession(client ?? ''),
        enabled: !!client,
        staleTime: Infinity,
    });
}
