import { subject } from '@casl/ability';
import React, { useEffect, type FC } from 'react';
import { Navigate, useParams } from 'react-router';
import ErrorState from '../components/common/ErrorState';
import { useProjects } from '../hooks/useProjects';
import { Can } from '../providers/Ability';
import useApp from '../providers/App/useApp';
import PageSpinner from './PageSpinner';
import { ProjectContext } from './ProjectContext';
import { ProjectContextService } from './ProjectContextService';

const ProjectRoute: FC<React.PropsWithChildren> = ({ children }) => {
    const { user } = useApp();
    const { projectUuid } = useParams();
    const { data: projects, isInitialLoading, isError, error } = useProjects();

    useEffect(() => {
        if (projectUuid) {
            // Store the current project ID whenever user navigates to a project
            ProjectContext.setCurrentProject(projectUuid);
            ProjectContextService.setCurrentProject(projectUuid);
        }
        return () => {
            // Clear the current project when the component unmounts
            ProjectContext.clearCurrentProject();
        };
    }, [projectUuid]);

    if (isInitialLoading) {
        return <PageSpinner />;
    }

    if (isError && error) {
        return <ErrorState error={error.error} />;
    }

    if (!projects || projects.length <= 0) {
        return <Navigate to="/no-access" />;
    }

    return (
        <Can
            I="view"
            this={subject('Project', {
                organizationUuid: user.data?.organizationUuid,
                projectUuid: projectUuid,
            })}
            passThrough
        >
            {(isAllowed) => {
                return isAllowed ? (
                    children
                ) : (
                    <Navigate to="/no-project-access" />
                );
            }}
        </Can>
    );
};

export default ProjectRoute;
