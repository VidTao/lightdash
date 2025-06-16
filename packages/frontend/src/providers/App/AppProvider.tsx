import { useEffect, type FC } from 'react';
import { setupAxiosInterceptor } from '../../bratrax-implementation/services/axios';
import useHealth from '../../hooks/health/useHealth';
import useUser from '../../hooks/user/useUser';
import AppProviderContext from './context';

const AppProvider: FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const health = useHealth();
    const user = useUser(!!health?.data?.isAuthenticated);

    const value = {
        health,
        user,
    };

    useEffect(() => {
        if (user.data?.userUuid) {
            setupAxiosInterceptor(user.data.userUuid);
        }
    }, [user.data?.userUuid]);

    return (
        <AppProviderContext.Provider value={value}>
            {children}
        </AppProviderContext.Provider>
    );
};

export default AppProvider;
