import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import PageSpinner from '../../components/PageSpinner';
import { useActiveProjectUuid } from '../../hooks/useActiveProject';
import { useRefetchUser } from '../../hooks/user/useRefetchUser';
import useApp from '../../providers/App/useApp';
import useQueryParams from '../hooks/useQueryParams';
import { apiService } from '../services/api';

const ClickFunnel2Callback = () => {
    const { code } = useQueryParams();
    const navigate = useNavigate();
    const { user } = useApp();
    const refetchUser = useRefetchUser();
    const { isLoading: isActiveProjectLoading, activeProjectUuid } =
        useActiveProjectUuid();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                if (code.length === 0) {
                    // If no code, navigate to projects
                    if (activeProjectUuid) {
                        navigate(`/projects/${activeProjectUuid}/home`);
                    } else {
                        navigate('/projects');
                    }
                    return;
                }

                if (user.isLoading || !user.data || isActiveProjectLoading) {
                    // If user data or project data is still loading, wait
                    return;
                }

                await apiService.generateClickFunnel2TokensDataAndSaveinBQ(
                    code,
                );

                // Refresh user data to update connection status
                await refetchUser();

                // Navigate to the active project's home page
                if (activeProjectUuid) {
                    navigate(`/projects/${activeProjectUuid}/home`);
                } else {
                    // Fallback to projects list if no active project
                    navigate('/projects');
                }
            } catch (err) {
                console.error('Error in ClickFunnel2 callback:', err);
            }
        };

        handleCallback();
    }, [
        code,
        navigate,
        user.isLoading,
        user.data,
        isActiveProjectLoading,
        activeProjectUuid,
        refetchUser,
    ]);

    return <PageSpinner />;
};

export default ClickFunnel2Callback;
