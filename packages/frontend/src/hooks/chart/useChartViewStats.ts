import { type ApiError, type ViewStatistics } from '@lightdash/common';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { lightdashApi } from '../../api';
import { queuedLightdashApi } from '../../api/queuedApi';

const getChartViewStats = async (chartUuid: string) => {
    return queuedLightdashApi<ViewStatistics>({
        url: `/saved/${chartUuid}/views`,
        method: 'GET',
        body: undefined,
    });
};

export const useChartViewStats = (
    chartUuid: string | undefined,
    queryOptions?: UseQueryOptions<ViewStatistics, ApiError>,
) => {
    return useQuery<ViewStatistics, ApiError>(
        ['chart-views', chartUuid],
        () => getChartViewStats(chartUuid || ''),
        {
            enabled: !!chartUuid,
            ...queryOptions,
        },
    );
};
