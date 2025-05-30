export const formatDate = (date: string | Date) => {
    if (date === '')
        return ''
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(new Date(date));
};