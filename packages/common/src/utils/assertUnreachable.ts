const assertUnreachable = (_x: any, error: string | Error): never => {
    if (typeof error === 'string') {
        throw Error(error);
    } else {
        throw error;
    }
};

export default assertUnreachable;
