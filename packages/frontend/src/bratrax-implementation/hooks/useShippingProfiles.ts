import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';
import useApp from '../../providers/App/useApp';
import { ShippingProfile } from '../models/interfaces';
import { apiService } from '../services/api';

export const useShippingProfiles = () => {
    const { isAuthSet } = useApp();
    const [shippingProfiles, setShippingProfiles] = useState<ShippingProfile[]>(
        [],
    );
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateShippingProfile = async (record: ShippingProfile) => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await apiService.updateShippingProfile(record);

            if (response.success) {
                // Update the local state to reflect the changes
                setShippingProfiles((prevProfiles) =>
                    prevProfiles.map((profile) =>
                        profile.profileId === record.profileId
                            ? record
                            : profile,
                    ),
                );

                notifications.show({
                    color: 'green',
                    message: 'Shipping profile updated successfully',
                });
                return true;
            } else {
                setError(response.error || 'Failed to update shipping profile');
                notifications.show({
                    color: 'red',
                    message:
                        response.error || 'Failed to update shipping profile',
                });
                return false;
            }
        } catch (error) {
            console.error('Error updating shipping profile:', error);
            setError('Failed to update shipping profile');
            notifications.show({
                color: 'red',
                message: 'Failed to update shipping profile',
            });
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const fetchShippingProfiles = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const results = await apiService.getShippingProfiles();

            if (results.success) {
                setShippingProfiles(results.data);
            } else {
                setError(results.error || 'Failed to fetch shipping profiles');
                notifications.show({
                    color: 'red',
                    message: 'Failed to fetch shipping profiles',
                });
            }
        } catch (error) {
            console.error('Error fetching shipping profiles:', error);
            setError('Failed to fetch shipping profiles');
            notifications.show({
                color: 'red',
                message: 'Failed to fetch shipping profiles',
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        console.log('value of isAuthSet:', isAuthSet);
        if (isAuthSet) {
            fetchShippingProfiles();
        }
    }, [isAuthSet]);

    return {
        shippingProfiles,
        setShippingProfiles,
        fetchShippingProfiles,
        updateShippingProfile,
        isLoading,
        error,
    };
};
