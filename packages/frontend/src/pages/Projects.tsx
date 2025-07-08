import { type FC } from 'react';
import { Navigate } from 'react-router';
import PageSpinner from '../components/PageSpinner';
import ErrorState from '../components/common/ErrorState';
import { useActiveProjectUuid } from '../hooks/useActiveProject';
import { useProjects } from '../hooks/useProjects';
import { useCharts } from '../hooks/useCharts';

const Projects: FC = () => {
    const { isInitialLoading, data, error } = useProjects();
    const { isLoading: isActiveProjectLoading, activeProjectUuid } =
        useActiveProjectUuid();
    const { isLoading: isChartDataLoading, data: chartData } = useCharts(activeProjectUuid);

    if (!isInitialLoading && data && data.length === 0) {
        return <Navigate to="/no-access" />;
    }

    if (isInitialLoading || isActiveProjectLoading || !activeProjectUuid || isChartDataLoading) {
        return <PageSpinner />;
    }

    if (error && error.error) {
        return <ErrorState error={error.error} />;
    }

    // if (chartData && chartData.length > 0) 
    //     return <Navigate to={`/projects/${activeProjectUuid}/home`} />;

    // else return <Navigate to={`/projects/${activeProjectUuid}/onboarding`} />;
    return <Navigate to={`/projects/${activeProjectUuid}/home`} />;
};

export default Projects;
