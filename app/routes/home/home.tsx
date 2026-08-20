import type { Route } from './+types/home';
import { useLoaderData } from 'react-router';
import { Container } from '@mantine/core';

import { HomeHero } from './components/HomeHero';
import { HomeFeaturesGrid } from './components/HomeFeaturesGrid';
import { HomeQuickStart } from './components/HomeQuickStart';
import { HomeDemoCallout } from './components/HomeDemoCallout';

import { loader } from './loader';

export { loader };
export { action } from './action';

export function meta(_args: Route.MetaArgs) {
    return [
        { title: 'Disney Lorcana Deck Matcher & Collection Tracker' },
        {
            name: 'description',
            content:
                'Seamlessly catalog your Disney Lorcana card collections (foil & non-foil) and instantly calculate completion matches against competitive deck lists.',
        },
    ];
}

export default function Home() {
    const { user } = useLoaderData<typeof loader>();

    const triggerDemoLogin = () => {
        const form = document.createElement('form');
        form.method = 'post';
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'intent';
        input.value = 'login-demo';
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
    };

    return (
        <Container size="lg" py={60}>
            <HomeHero />
            <HomeFeaturesGrid />
            <HomeQuickStart />
            {!user && <HomeDemoCallout onTriggerDemoLogin={triggerDemoLogin} />}
        </Container>
    );
}
