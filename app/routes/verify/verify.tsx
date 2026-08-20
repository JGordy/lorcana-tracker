import { useLoaderData } from 'react-router';
import { Container } from '@mantine/core';
import { VerifyCard } from './components/VerifyCard';
import { loader } from './loader';

export { loader };

export function meta() {
    return [{ title: 'Email Verification | GlimmerForge' }];
}

export default function Verify() {
    const { success, message } = useLoaderData<typeof loader>();

    return (
        <Container size="xs" py={80}>
            <VerifyCard success={success} message={message} />
        </Container>
    );
}
