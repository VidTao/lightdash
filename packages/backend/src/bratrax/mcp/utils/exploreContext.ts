import type { Explore } from '@lightdash/common';

/**
 * Lightweight wrapper around an array of explores that provides
 * lookup-by-name with a clear error when the requested explore
 * does not exist. Used by the run_metric_query tool.
 */
export class ExploreContext {
    private readonly byName: Map<string, Explore>;

    constructor(explores: Explore[]) {
        this.byName = new Map(explores.map((e) => [e.name, e]));
    }

    getExplore(name: string): Explore {
        const explore = this.byName.get(name);
        if (!explore) {
            throw new Error(
                `Explore '${name}' not found. Available explores: ${[...this.byName.keys()].join(', ')}`,
            );
        }
        return explore;
    }

    getAll(): Explore[] {
        return [...this.byName.values()];
    }
}
