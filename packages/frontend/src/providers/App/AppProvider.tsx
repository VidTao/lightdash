import { useEffect, useState, type FC } from 'react';
import { setupAxiosInterceptor } from '../../bratrax-implementation/services/axios';
import useHealth from '../../hooks/health/useHealth';
import useUser from '../../hooks/user/useUser';
import AppProviderContext from './context';

const AppProvider: FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const health = useHealth();
    const user = useUser(!!health?.data?.isAuthenticated);
    const [isAuthSet, setIsAuthSet] = useState(false);

    const value = {
        health,
        user,
        isAuthSet,
    };

    useEffect(() => {
        if (user.data?.userUuid) {
            setupAxiosInterceptor(user.data.userUuid);
            setIsAuthSet(true);
        }
    }, [user.data?.userUuid]);

    return (
        <AppProviderContext.Provider value={value}>
            {children}
        </AppProviderContext.Provider>
    );
};

export default AppProvider;
