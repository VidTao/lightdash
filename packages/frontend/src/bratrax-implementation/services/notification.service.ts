import { notifications } from '@mantine/notifications';

export class NotificationService {
    showSuccessNotification(title: string, message: string) {
        notifications.show({
            title,
            message,
            color: 'green',
            autoClose: 5000,
        });
    }

    showErrorNotification(title: string, message: string) {
        notifications.show({
            title,
            message,
            color: 'red',
            autoClose: 5000,
        });
    }
}

export const notificationService = new NotificationService();
