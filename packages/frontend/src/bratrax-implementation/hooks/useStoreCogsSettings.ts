import { useEffect, useState } from 'react';
import useApp from '../../providers/App/useApp';
import { COGSSettings } from '../models/interfaces';
import { apiService } from '../services/api';

interface UseStoreCogsSettingsProps {
    selectedTabKey: string;
    writeKeyId: number;
}

export const useStoreCogsSettings = ({
    selectedTabKey,
    writeKeyId,
}: UseStoreCogsSettingsProps) => {
    const { isAuthSet } = useApp();
    const [cogsSettings, setCogsSettings] = useState<COGSSettings>({
        enableCOGS: false,
        enableHandlingFee: false,
        handlingFee: 2,
        bidirectionalCOGS: false,
    });
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Default COGS settings to reset to when no data is found
    const defaultCogsSettings: COGSSettings = {
        enableCOGS: false,
        enableHandlingFee: false,
        handlingFee: 2,
        bidirectionalCOGS: false,
    };

    useEffect(() => {
        const fetchStoreCogsSettings = async () => {
            try {
                setIsLoading(true);
                const platformType = selectedTabKey;
                const settings = await apiService.getStoreCogsSettings(
                    platformType,
                    writeKeyId,
                );

                if (settings.success && settings.data) {
                    // Data exists, populate the form
                    const data = settings.data;
                    setCogsSettings({
                        enableCOGS: data.enable_global_cogs,
                        enableHandlingFee: data.enable_handling_fee,
                        handlingFee: data.global_handling_fee || 0,
                        bidirectionalCOGS: data.bidirectional_cogs,
                    });
                } else {
                    // No data found, reset to defaults
                    setCogsSettings(defaultCogsSettings);
                }
                setError(null);
            } catch (error) {
                console.error('Error fetching store COGS settings:', error);
                setError('Failed to load COGS settings');
                // Reset to defaults on error as well
                setCogsSettings(defaultCogsSettings);
            } finally {
                setIsLoading(false);
            }
        };

        if (isAuthSet && writeKeyId > 0) {
            fetchStoreCogsSettings();
        } else if (writeKeyId === 0) {
            // If no write key is selected, reset to defaults
            setCogsSettings(defaultCogsSettings);
        }
    }, [selectedTabKey, writeKeyId, isAuthSet]);

    const updateStoreCogsSettings = async () => {
        try {
            setIsLoading(true);
            const platformType = selectedTabKey;
            const response = await apiService.updateStoreCogsSettings(
                platformType,
                cogsSettings,
                writeKeyId,
            );

            if (response.success) {
                setError(null);
                return true;
            } else {
                setError('Failed to update COGS settings');
                return false;
            }
        } catch (error) {
            console.error('Error updating store COGS settings:', error);
            setError('Failed to update COGS settings');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        cogsSettings,
        setCogsSettings,
        updateStoreCogsSettings,
        isLoading,
        error,
    };
};
