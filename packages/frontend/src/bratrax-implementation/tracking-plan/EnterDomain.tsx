import { Button, Paper, Stack, TextInput, Title } from '@mantine/core';
import { useState } from 'react';

interface EnterDomainProps {
    onDomainSelected: (domain: string) => void;
}

const EnterDomain = ({ onDomainSelected }: EnterDomainProps) => {
    const [domain, setDomain] = useState('');
    const [error, setError] = useState('');

    const validateDomain = (value: string) => {
        // Basic domain validation regex
        const domainRegex =
            /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
        return domainRegex.test(value);
    };

    const handleSubmit = () => {
        if (!domain) {
            setError('Domain is required!');
            onDomainSelected('');
            return;
        }

        if (!validateDomain(domain)) {
            setError('Please enter a valid domain (e.g., example.com)');
            onDomainSelected('');
            return;
        }

        setError('');
        onDomainSelected(domain);
    };

    return (
        <Stack spacing="lg" justify="space-between" h="100%">
            <Stack spacing="lg">
                <Title order={3}>Enter your main domain</Title>
                <TextInput
                    value={domain}
                    onChange={(e) => {
                        setDomain(e.target.value);
                        setError('');
                    }}
                    placeholder="example.com"
                    error={error}
                />
            </Stack>
            <Button onClick={handleSubmit} fullWidth>
                Submit
            </Button>
        </Stack>
    );
};

export default EnterDomain;
