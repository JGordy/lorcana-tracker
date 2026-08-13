import type { Route } from "./+types/decks";
import { useLoaderData, useSubmit, useFetcher, Link, useNavigate, data } from "react-router";
import { useState } from "react";
import {
  Container,
  Title,
  Text,
  Button,
  Card,
  Group,
  Stack,
  Progress,
  Badge,
  Collapse,
  Table,
  TextInput,
  Select,
  Box,
  ActionIcon,
} from "@mantine/core";
import { IconSearch, IconChevronDown, IconChevronUp, IconPlus, IconCheck, IconAlertTriangle, IconBrandYoutube } from "@tabler/icons-react";
import { authService, dbService, isConfigured, COLLECTIONS, type UserCollectionItemDoc, type DeckWithProgress } from "../services/appwrite";
import { Navbar } from "../components/Navbar";

// ---------------------------------------------------------
// Loader (Runs on the Server in SSR mode)
// ---------------------------------------------------------
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const sort = (url.searchParams.get("sort") || "progress") as "progress" | "missing_cost" | "name";
  const cookieHeader = request.headers.get("Cookie");

  // Get active session user
  const user = await authService.getSessionUser();
  const userId = user ? user.$id : null;

  // Retrieve public decks with computed progress
  const decks = await dbService.getDecksWithProgress(userId, sort, cookieHeader);

  return { decks, user, sort };
}

// ---------------------------------------------------------
// Action (Runs on the Server in SSR mode)
// ---------------------------------------------------------
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const cookieHeader = request.headers.get("Cookie");

  if (intent === "logout") {
    await authService.logout();
    return { success: true };
  }

  if (intent === "login-demo") {
    await authService.anonymousLogin();
    return { success: true };
  }

  if (intent === "quick-add") {
    const userId = formData.get("userId") as string;
    const cardId = formData.get("cardId") as string;
    const quantity = parseInt(formData.get("quantity") as string, 10);
    const isFoil = formData.get("isFoil") === "true";

    const updatedItem = await dbService.updateInventory(userId, cardId, quantity, isFoil, cookieHeader);

    if (!isConfigured) {
      const allMockInventory = await dbService.getCollection<UserCollectionItemDoc>(
        COLLECTIONS.USER_COLLECTIONS,
        [],
        cookieHeader
      );
      const serialized = encodeURIComponent(JSON.stringify(allMockInventory));
      return data(
        { success: true, updatedItem },
        {
          headers: {
            "Set-Cookie": `lorcana_user_inventory=${serialized}; Path=/; Max-Age=31536000; SameSite=Lax`,
          },
        }
      );
    }
    return { success: true, updatedItem };
  }

  return { success: false };
}

// Helper to map Lorcana ink colors to Mantine badge colors
// Helper to map Lorcana ink colors to custom hex styling
function getInkBadgeStyle(color: string) {
  const normalized = color.toLowerCase();
  let hex = "#94a3b8"; // default slate

  switch (normalized) {
    case "amber":
      hex = "#F5B041"; // Vibrant Gold-Amber
      break;
    case "amethyst":
      hex = "#AF7AC5"; // Vibrant Amethyst Violet
      break;
    case "emerald":
      hex = "#2ECC71"; // Jade Emerald Green
      break;
    case "ruby":
      hex = "#EC7063"; // Ruby Crimson
      break;
    case "sapphire":
      hex = "#5DADE2"; // Sapphire Blue
      break;
    case "steel":
      hex = "#A6ACAF"; // Steel Metallic Grey
      break;
  }

  return {
    backgroundColor: `${hex}1F`, // ~12% opacity background
    borderColor: `${hex}66`,     // ~40% opacity border
    color: hex,
    textTransform: "uppercase" as const,
    fontWeight: 700,
    letterSpacing: "0.5px",
  };
}

export default function Decks() {
  const { decks, user, sort } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDecks, setExpandedDecks] = useState<Record<string, boolean>>({});

  const toggleDeckExpand = (deckId: string) => {
    setExpandedDecks((prev) => ({
      ...prev,
      [deckId]: !prev[deckId],
    }));
  };

  const handleQuickAdd = (cardId: string, currentOwned: number) => {
    if (!user) {
      alert("Please sign in with a demo session to update your inventory.");
      return;
    }
    fetcher.submit(
      {
        intent: "quick-add",
        userId: user.$id,
        cardId,
        quantity: (currentOwned + 1).toString(),
        isFoil: "false", // Default to normal copies for quick add
      },
      { method: "post" }
    );
  };

  // Filter decks locally based on deck title, creator, or descriptions
  const filteredDecks = decks.filter(
    (deck) =>
      deck.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deck.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box mih="100vh" bg="dark.9" c="gray.1">
      <Navbar user={user} />

      <Container size="lg" py="xl">
        {/* Banner Hero */}
        <Card
          padding="xl"
          radius="lg"
          withBorder
          mb="xl"
          bg="dark.8"
          style={(theme) => ({
            borderColor: theme.colors.dark[7],
            position: "relative",
            overflow: "hidden",
          })}
        >
          {/* Accent blurs */}
          <Box
            style={{
              position: "absolute",
              top: "-50px",
              right: "-50px",
              width: "200px",
              height: "200px",
              backgroundColor: "rgba(124, 58, 237, 0.05)",
              filter: "blur(50px)",
              borderRadius: "100%",
            }}
          />
          <Stack gap="xs" style={{ position: "relative", zIndex: 1 }}>
            <Title order={1} size="xl" fw={900}>
              Disney Lorcana Metagame Deck Matcher
            </Title>
            <Text size="sm" c="gray.4" maw={800} style={{ lineHeight: 1.6 }}>
              Upload or manage your card collection inventory. Our recommendation engine automatically scans
              meta decks, displays the percentage of cards you own, and calculates the exact missing card counts to optimize your next buy list.
            </Text>
          </Stack>
        </Card>

        {/* Filter Controls Row */}
        <Group justify="space-between" mb="lg" gap="md">
          <TextInput
            placeholder="Search meta decks..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, maxWidth: 350 }}
          />

          <Select
            label="Sort by:"
            value={sort}
            onChange={(val) => {
              if (val) {
                navigate(`/decks?sort=${val}`);
              }
            }}
            data={[
              { value: "progress", label: "Highest Match %" },
              { value: "missing_cost", label: "Lowest Missing Count" },
              { value: "name", label: "Alphabetical (A-Z)" },
            ]}
            style={{ width: 220 }}
          />
        </Group>

        {/* Deck Card list */}
        {filteredDecks.length === 0 ? (
          <Card padding="xl" radius="md" withBorder bg="dark.8" style={{ textAlign: "center", borderStyle: "dashed" }}>
            <Text c="gray.5" size="sm">No decks found matching your filters.</Text>
          </Card>
        ) : (
          <Stack gap="md">
            {filteredDecks.map((deck) => {
              const { percentage, ownedCount, totalCount, missingCards } = deck.progress;
              const isExpanded = expandedDecks[deck.$id];

              // Decide colors based on progress
              let progressColor = "red";
              if (percentage >= 80) progressColor = "emerald";
              else if (percentage >= 50) progressColor = "amber";

              // Map color code to Mantine color
              const mColor = progressColor === "emerald" ? "teal" : progressColor === "amber" ? "yellow" : "red";

              return (
                <Card
                  key={deck.$id}
                  padding="lg"
                  radius="md"
                  withBorder
                  bg="dark.8"
                  style={(theme) => ({ borderColor: theme.colors.dark[7] })}
                >
                  <Stack gap="md">
                    {/* Header line info */}
                    <Group justify="space-between" align="start">
                      <Box style={{ flex: 1 }}>
                        <Group gap="xs" mb={4} align="center">
                          <Text fw={700} size="md" c="gray.1">
                            {deck.title}
                          </Text>
                          {deck.is_trending ? (
                            <Badge size="xs" variant="gradient" gradient={{ from: "violet", to: "grape" }}>
                              Trending Meta
                            </Badge>
                          ) : (
                            <Badge size="xs" variant="outline" color="blue">
                              Local Deck
                            </Badge>
                          )}
                          {deck.youtube && (
                            <Button
                              component="a"
                              href={`https://www.youtube.com/watch?v=${deck.youtube}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              size="10px"
                              px="xs"
                              variant="light"
                              color="red"
                              leftSection={<IconBrandYoutube size={12} />}
                              style={{ height: 18 }}
                            >
                              Watch Guide
                            </Button>
                          )}
                        </Group>
                        <Text size="xs" c="gray.4">
                          {deck.description}
                        </Text>
                      </Box>

                      {/* Progress Metrics */}
                      <Stack gap={4} align="end" style={{ minWidth: 150 }}>
                        <Badge size="sm" variant="light" color={mColor}>
                          {ownedCount}/{totalCount} Owned ({percentage}%)
                        </Badge>
                        <Progress
                          value={percentage}
                          color={mColor}
                          size="sm"
                          radius="xl"
                          striped
                          style={{ width: 120 }}
                        />
                      </Stack>
                    </Group>

                    {/* Expand buttons line */}
                    <Group justify="space-between" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 12 }}>
                      <Text size="xs" c="gray.5" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        {missingCards.length === 0 ? (
                          <Text component="span" c="teal.4" fw={500} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <IconCheck size={14} /> Ready to play! You own all cards.
                          </Text>
                        ) : (
                          <Text component="span" c="rose.4" fw={500} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <IconAlertTriangle size={14} /> Missing {totalCount - ownedCount} cards
                          </Text>
                        )}
                      </Text>

                      <Button
                        variant="subtle"
                        color="violet"
                        size="xs"
                        onClick={() => toggleDeckExpand(deck.$id)}
                        rightSection={isExpanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
                      >
                        {isExpanded ? "Hide Details" : "View Card List"}
                      </Button>
                    </Group>

                    {/* Collapsible card table details */}
                    <Collapse expanded={isExpanded}>
                      <Box py="sm" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", overflowX: "auto" }}>
                        <Table striped highlightOnHover variant="vertical" style={{ minWidth: 600 }}>
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th style={{ color: "var(--mantine-color-gray-5)", fontSize: 11 }}>Card Name</Table.Th>
                              <Table.Th style={{ color: "var(--mantine-color-gray-5)", fontSize: 11 }}>Ink Color</Table.Th>
                              <Table.Th style={{ color: "var(--mantine-color-gray-5)", fontSize: 11, textAlign: "center" }}>Cost</Table.Th>
                              <Table.Th style={{ color: "var(--mantine-color-gray-5)", fontSize: 11, textAlign: "center" }}>Rarity</Table.Th>
                              <Table.Th style={{ color: "var(--mantine-color-gray-5)", fontSize: 11, textAlign: "center" }}>Required</Table.Th>
                              <Table.Th style={{ color: "var(--mantine-color-gray-5)", fontSize: 11, textAlign: "center" }}>Owned</Table.Th>
                              <Table.Th style={{ color: "var(--mantine-color-gray-5)", fontSize: 11, textAlign: "center" }}>Status</Table.Th>
                              {user && <Table.Th style={{ color: "var(--mantine-color-gray-5)", fontSize: 11, textAlign: "right" }}>Quick Add</Table.Th>}
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {deck.cards.map(({ card, requiredQty, ownedQty }) => {
                              const isMissing = ownedQty < requiredQty;
                              const missingCount = requiredQty - ownedQty;

                              return (
                                <Table.Tr key={card.$id}>
                                  <Table.Td style={{ fontWeight: 500 }}>
                                    <Group gap="xs">
                                      <Text size="xs">{card.name}</Text>
                                      {card.formats.includes("core") && (
                                        <Badge size="10px" variant="outline" color="gray">
                                          Core
                                        </Badge>
                                      )}
                                    </Group>
                                  </Table.Td>
                                  <Table.Td>
                                    <Badge size="xs" variant="outline" style={getInkBadgeStyle(card.ink_color)}>
                                      {card.ink_color}
                                    </Badge>
                                  </Table.Td>
                                  <Table.Td style={{ textAlign: "center", fontWeight: 700 }}>
                                    {card.cost}
                                  </Table.Td>
                                  <Table.Td style={{ textAlign: "center", fontSize: 11 }}>
                                    {card.rarity}
                                  </Table.Td>
                                  <Table.Td style={{ textAlign: "center", fontWeight: 700 }}>
                                    {requiredQty}
                                  </Table.Td>
                                  <Table.Td
                                    style={{
                                      textAlign: "center",
                                      fontWeight: 700,
                                      color: isMissing ? "var(--mantine-color-red-4)" : "var(--mantine-color-teal-4)",
                                    }}
                                  >
                                    {ownedQty}
                                  </Table.Td>
                                  <Table.Td style={{ textAlign: "center" }}>
                                    {isMissing ? (
                                      <Badge size="xs" color="red" variant="light">
                                        Need {missingCount}
                                      </Badge>
                                    ) : (
                                      <Badge size="xs" color="teal" variant="light">
                                        Matched
                                      </Badge>
                                    )}
                                  </Table.Td>
                                  {user && (
                                    <Table.Td style={{ textAlign: "right" }}>
                                      <ActionIcon
                                        size="sm"
                                        variant="filled"
                                        color="violet"
                                        onClick={() => handleQuickAdd(card.id, ownedQty)}
                                        title="Quick Add 1 copy to your collection"
                                      >
                                        <IconPlus size={12} />
                                      </ActionIcon>
                                    </Table.Td>
                                  )}
                                </Table.Tr>
                              );
                            })}
                          </Table.Tbody>
                        </Table>
                      </Box>
                    </Collapse>
                  </Stack>
                </Card>
              );
            })}
          </Stack>
        )}
      </Container>
    </Box>
  );
}
