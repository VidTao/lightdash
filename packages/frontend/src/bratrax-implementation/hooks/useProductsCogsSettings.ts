import { useEffect, useState } from 'react';
import useApp from '../../providers/App/useApp';
import { apiService } from '../services/api';

interface UseProductsCogsSettingsProps {
    selectedTabKey: string;
    selectedMarketplace: string;
    writeKeyId: number;
}

export const useProductsCogsSettings = ({
    selectedTabKey,
    selectedMarketplace,
    writeKeyId,
}: UseProductsCogsSettingsProps) => {
    const { isAuthSet } = useApp();
    const [productsCogsSettings, setProductsCogsSettings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProductsWithCogs = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const platformType = selectedTabKey;
                const results = await apiService.getProductsWithCogsSettings(
                    platformType,
                    selectedMarketplace,
                    writeKeyId,
                );

                if (results.success) {
                    setProductsCogsSettings(results.data);
                } else {
                    setError(
                        results.error || 'Failed to load product COGS settings',
                    );
                }
            } catch (error) {
                console.error(
                    'Error fetching products with COGS settings:',
                    error,
                );
                setError('Failed to load product COGS settings');
            } finally {
                setIsLoading(false);
            }
        };
        
        if (isAuthSet && writeKeyId > 0 && selectedTabKey !== '' && selectedMarketplace !== '') {
            fetchProductsWithCogs();
        } else if (writeKeyId === 0) {
            // Reset to empty array when no write key is selected
            setProductsCogsSettings([]);
        }
    }, [selectedTabKey, selectedMarketplace, writeKeyId, isAuthSet]);

    const updateProductsCogsSettings = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const platformType = selectedTabKey;
            const results = await apiService.updateProductCogsSettings(
                platformType,
                productsCogsSettings,
                writeKeyId,
            );

            if (results.success) {
                return true;
            } else {
                setError(
                    results.error || 'Failed to update product COGS settings',
                );
                return false;
            }
        } catch (error) {
            console.error('Error updating products COGS settings:', error);
            setError('Failed to update product COGS settings');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        productsCogsSettings,
        setProductsCogsSettings,
        updateProductsCogsSettings,
        isLoading,
        error,
    };
};
