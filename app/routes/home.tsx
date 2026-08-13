import type { Route } from "./+types/home";
import { Link, useLoaderData } from "react-router";
import { Container, Title, Text, Button, SimpleGrid, Card, Group, Stack, ThemeIcon, Box, Badge } from "@mantine/core";
import { IconCards, IconDatabase, IconFilter, IconArrowRight, IconSparkles } from "@tabler/icons-react";
import { authService } from "../services/appwrite";
import { Navbar } from "../components/Navbar";

// ---------------------------------------------------------
// Loader (Runs on the Server in SSR mode)
// ---------------------------------------------------------
export async function loader({ request }: Route.LoaderArgs) {
  const user = await authService.getSessionUser();
  return { user };
}

// ---------------------------------------------------------
// Action (Runs on the Server in SSR mode)
// ---------------------------------------------------------
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "logout") {
    await authService.logout();
    return { success: true };
  }

  if (intent === "login-demo") {
    await authService.anonymousLogin();
    return { success: true };
  }

  return { success: false };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Disney Lorcana Deck Matcher & Collection Tracker" },
    {
      name: "description",
      content:
        "Seamlessly catalog your Disney Lorcana card collections (foil & non-foil) and instantly calculate completion matches against competitive deck lists.",
    },
  ];
}

export default function Home() {
  const { user } = useLoaderData<typeof loader>();

  const triggerDemoLogin = () => {
    const form = document.createElement("form");
    form.method = "post";
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "intent";
    input.value = "login-demo";
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
  };

  return (
    <Box mih="100vh" bg="dark.9" c="gray.1">
      <Navbar user={user} />

      <Container size="lg" py={60}>
        {/* Hero Section */}
        <Stack align="center" gap="lg" style={{ textAlign: "center", position: "relative" }}>
          {/* Subtle violet highlight blur background */}
          <Box
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "320px",
              height: "320px",
              backgroundColor: "rgba(124, 58, 237, 0.08)",
              filter: "blur(80px)",
              borderRadius: "100%",
              zIndex: 0,
            }}
          />

          <Badge variant="filled" color="violet" size="lg">
            Lorcana Recommendation Engine
          </Badge>

          <Title
            order={1}
            size="h1"
            style={(theme) => ({
              fontWeight: 900,
              fontSize: "3rem",
              lineHeight: 1.15,
              background: `linear-gradient(135deg, ${theme.colors.violet[2]} 0%, ${theme.colors.pink[2]} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              zIndex: 1,
            })}
          >
            LoreWise
          </Title>

          <Text size="md" c="gray.4" maw={600} mx="auto" style={{ zIndex: 1, lineHeight: 1.6 }}>
            Stop guessing which decks you can build. Manage your physical collection card-by-card, and let LoreWise calculate ownership scores across meta decks instantly.
          </Text>

          <Group gap="md" mt="md" style={{ zIndex: 1 }}>
            <Button
              component={Link}
              to="/collection"
              size="md"
              variant="gradient"
              gradient={{ from: "violet.6", to: "indigo.6" }}
              rightSection={<IconArrowRight size={16} />}
            >
              Manage My Collection
            </Button>
            <Button
              component={Link}
              to="/decks"
              size="md"
              variant="outline"
              color="gray"
            >
              Browse Public Decks
            </Button>
          </Group>
        </Stack>

        {/* Feature Cards Grid */}
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" mt={80}>
          {/* Feature 1 */}
          <Card padding="lg" radius="md" withBorder bg="dark.8" style={(theme) => ({ borderColor: theme.colors.dark[7] })}>
            <ThemeIcon size="lg" radius="md" variant="light" color="violet" mb="md">
              <IconCards size={20} />
            </ThemeIcon>
            <Text fw={700} size="md" mb="xs" c="gray.2">
              Catalog Collection
            </Text>
            <Text size="xs" c="gray.5" style={{ lineHeight: 1.5 }}>
              Log both your normal and foil versions of cards from your physical Lorcana booster packs. Everything saves automatically to your secure inventory.
            </Text>
          </Card>

          {/* Feature 2 */}
          <Card padding="lg" radius="md" withBorder bg="dark.8" style={(theme) => ({ borderColor: theme.colors.dark[7] })}>
            <ThemeIcon size="lg" radius="md" variant="light" color="indigo" mb="md">
              <IconDatabase size={20} />
            </ThemeIcon>
            <Text fw={700} size="md" mb="xs" c="gray.2">
              Progress Matcher
            </Text>
            <Text size="xs" c="gray.5" style={{ lineHeight: 1.5 }}>
              Our matching loop sums card versions and maps your inventory quantities against competitive deck recipes, generating a completion percentage badge.
            </Text>
          </Card>

          {/* Feature 3 */}
          <Card padding="lg" radius="md" withBorder bg="dark.8" style={(theme) => ({ borderColor: theme.colors.dark[7] })}>
            <ThemeIcon size="lg" radius="md" variant="light" color="rose" mb="md">
              <IconFilter size={20} />
            </ThemeIcon>
            <Text fw={700} size="md" mb="xs" c="gray.2">
              Smart Sort Engine
            </Text>
            <Text size="xs" c="gray.5" style={{ lineHeight: 1.5 }}>
              Sort decks by &quot;Highest Progress First&quot; or &quot;Lowest Cost to Complete&quot; to see exactly what you can play or buy next with the lowest expense.
            </Text>
          </Card>
        </SimpleGrid>

        {/* Demo Callout */}
        {!user && (
          <Card
            padding="xl"
            radius="md"
            withBorder
            mt={80}
            mx="auto"
            maw={700}
            bg="violet.9"
            style={(theme) => ({
              borderColor: theme.colors.violet[8],
              backgroundColor: "rgba(124, 58, 237, 0.03)",
              textAlign: "center",
            })}
          >
            <Group justify="center" gap="xs" mb="xs">
              <ThemeIcon variant="transparent" color="violet.4">
                <IconSparkles size={20} />
              </ThemeIcon>
              <Text fw={700} size="md" c="violet.3">
                Ready to test it in Action?
              </Text>
            </Group>
            <Text size="xs" c="gray.4" mb="lg" style={{ lineHeight: 1.5 }}>
              No Appwrite cloud database credentials required to try out the logic. Click the Sign In button below to launch an anonymous mock-user session. We will seed a sample inventory so you can see match percentages immediately!
            </Text>
            <Button
              onClick={triggerDemoLogin}
              variant="gradient"
              gradient={{ from: "violet.6", to: "indigo.6" }}
              size="sm"
              fw={700}
            >
              Sign In & Seed Mock Collection
            </Button>
          </Card>
        )}
      </Container>
    </Box>
  );
}
