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
  Tabs,
  Modal,
  Textarea,
  Tooltip,
} from "@mantine/core";
import { IconSearch, IconChevronDown, IconChevronUp, IconPlus, IconCheck, IconAlertTriangle, IconBrandYoutube, IconCards, IconInfinity, IconUpload } from "@tabler/icons-react";
import { authService, dbService, isConfigured, COLLECTIONS, type UserCollectionItemDoc, type DeckWithProgress, type Card as LorcanaCard, SET_NAME_TO_INDEX } from "../services/appwrite";
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

  // Retrieve public decks and cards concurrently
  const [decks, cards] = await Promise.all([
    dbService.getDecksWithProgress(userId, sort, cookieHeader),
    dbService.getCollection<LorcanaCard>(COLLECTIONS.CARDS, [], cookieHeader),
  ]);

  return { decks, cards, user, sort };
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

  if (intent === "import-deck") {
    const userId = formData.get("userId") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const cardsJson = formData.get("cards") as string;
    const cardsList = JSON.parse(cardsJson) as Array<{ cardId: string; quantity: number }>;

    const result = await dbService.createDeck(userId, title, description, cardsList, cookieHeader);

    if (!isConfigured) {
      const [allMockDecks, allMockDeckCards] = await Promise.all([
        dbService.getCollection<any>(COLLECTIONS.DECKS, [], cookieHeader),
        dbService.getCollection<any>(COLLECTIONS.DECK_CARDS, [], cookieHeader),
      ]);
      
      const serializedDecks = encodeURIComponent(JSON.stringify(allMockDecks));
      const serializedDeckCards = encodeURIComponent(JSON.stringify(allMockDeckCards));

      const headers = new Headers();
      headers.append("Set-Cookie", `lorcana_user_decks=${serializedDecks}; Path=/; Max-Age=31536000; SameSite=Lax`);
      headers.append("Set-Cookie", `lorcana_user_deck_cards=${serializedDeckCards}; Path=/; Max-Age=31536000; SameSite=Lax`);

      return data({ success: true, result }, { headers });
    }

    return { success: true, result };
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
  const { decks, cards, user, sort } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDecks, setExpandedDecks] = useState<Record<string, boolean>>({});

  // Import Deck states
  const submit = useSubmit();
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importTitle, setImportTitle] = useState("");
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [parsedResults, setParsedResults] = useState<{
    matched: Array<{ card: LorcanaCard; quantity: number }>;
    unmatched: Array<{ name: string; quantity: number; setCode?: string }>;
  } | null>(null);

  const handleValidateImport = () => {
    if (!importText.trim()) {
      setImportError("Please paste a decklist first.");
      setParsedResults(null);
      return;
    }

    const lines = importText.split("\n");
    const matched: Array<{ card: LorcanaCard; quantity: number }> = [];
    const unmatched: Array<{ name: string; quantity: number; setCode?: string }> = [];

    const cardsByName = new Map<string, LorcanaCard>();
    const cardsBySetNum = new Map<string, LorcanaCard>();

    cards.forEach((c) => {
      cardsByName.set(c.name.toLowerCase().trim(), c);
      const setIdx = SET_NAME_TO_INDEX[c.set];
      if (setIdx !== undefined) {
        const setCode = `${setIdx.toString().padStart(3, "0")}-${c.number.toString().padStart(3, "0")}`;
        cardsBySetNum.set(setCode, c);
        cardsBySetNum.set(`${setIdx}-${c.number}`, c);
      }
    });

    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith("//") || line.startsWith("#") || line.toLowerCase().startsWith("deck:")) {
        continue;
      }

      const match = line.match(/^(\d+)\s+x?\s*([^(]+)(?:\(([^)]+)\))?/i);
      if (!match) {
        const simpleMatch = line.match(/^(\d+)\s+(.+)$/);
        if (simpleMatch) {
          const qty = parseInt(simpleMatch[1], 10);
          const name = simpleMatch[2].trim();
          const card = cardsByName.get(name.toLowerCase());
          if (card) {
            matched.push({ card, quantity: qty });
          } else {
            unmatched.push({ name, quantity: qty });
          }
        }
        continue;
      }

      const qty = parseInt(match[1], 10);
      const rawName = match[2].trim();
      const setCodeRaw = match[3]?.trim();

      const cardName = rawName.replace(/\s+x\d+$/i, "").trim();
      let resolvedCard: LorcanaCard | undefined = undefined;

      if (setCodeRaw) {
        resolvedCard = cardsBySetNum.get(setCodeRaw);
        if (!resolvedCard) {
          const normalizedCode = setCodeRaw.replace(/[\/\s]/g, "-");
          resolvedCard = cardsBySetNum.get(normalizedCode);
        }
      }

      if (!resolvedCard) {
        resolvedCard = cardsByName.get(cardName.toLowerCase());
      }

      if (!resolvedCard) {
        const normalizedInput = cardName.toLowerCase().replace(/[^a-z0-9]/g, "");
        resolvedCard = cards.find(c => c.name.toLowerCase().replace(/[^a-z0-9]/g, "") === normalizedInput);
      }

      if (resolvedCard) {
        matched.push({ card: resolvedCard, quantity: qty });
      } else {
        unmatched.push({ name: cardName, quantity: qty, setCode: setCodeRaw });
      }
    }

    setParsedResults({ matched, unmatched });
    setImportError(null);
  };

  const handleSubmitImport = () => {
    if (!importTitle.trim()) {
      setImportError("Please enter a Deck Title.");
      return;
    }
    if (!parsedResults || parsedResults.matched.length === 0) {
      setImportError("Please validate the deck first and ensure at least one card is matched.");
      return;
    }

    const payload = parsedResults.matched.map((m) => ({
      cardId: m.card.id,
      quantity: m.quantity,
    }));

    submit(
      {
        intent: "import-deck",
        userId: user ? user.$id : "guest-user",
        title: importTitle,
        description: "User imported custom deck",
        cards: JSON.stringify(payload),
      },
      { method: "post" }
    );

    setImportModalOpen(false);
    setImportTitle("");
    setImportText("");
    setParsedResults(null);
  };

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

  // Compute Core legality for each deck dynamically
  const processedDecks = filteredDecks.map((deck) => {
    const isCoreLegal = deck.cards.every((dc) => dc.card.formats?.includes("core"));
    return {
      ...deck,
      isCoreLegal,
    };
  });

  const coreDecks = processedDecks.filter((deck) => deck.isCoreLegal);
  const infinityDecks = processedDecks;

  const renderDeckList = (decksToRender: typeof processedDecks) => {
    if (decksToRender.length === 0) {
      return (
        <Card padding="xl" radius="md" withBorder bg="dark.8" style={{ textAlign: "center", borderStyle: "dashed" }}>
          <Text c="gray.5" size="sm">No decks found matching your filters in this format.</Text>
        </Card>
      );
    }

    return (
      <Stack gap="md">
        {decksToRender.map((deck) => {
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
                      {/* Ink color icons */}
                      <Group gap={4} mr="xs">
                        {Array.from(
                          new Set(
                            deck.cards.flatMap((dc) =>
                              dc.card.ink_color ? dc.card.ink_color.split("/") : []
                            )
                          )
                        ).map((inkName) => (
                          <img
                            key={inkName}
                            src={`/inks/${inkName.toLowerCase().trim()}.svg`}
                            alt={inkName}
                            style={{ width: 18, height: 18, display: "block" }}
                            title={inkName}
                          />
                        ))}
                      </Group>
                      {deck.is_trending ? (
                        <Badge size="xs" variant="gradient" gradient={{ from: "violet", to: "grape" }}>
                          Trending Meta
                        </Badge>
                      ) : (
                        <Badge size="xs" variant="outline" color="blue">
                          Local Deck
                        </Badge>
                      )}
                      
                      {deck.isCoreLegal ? (
                        <Badge size="xs" variant="light" color="teal">
                          Core Legal
                        </Badge>
                      ) : (
                        <Badge size="xs" variant="light" color="orange">
                          Infinity Only
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
                                  <Tooltip
                                    label={
                                      <Box style={{ width: 260, height: 365, display: "flex", justifyContent: "center", alignItems: "center" }}>
                                        {card.image_url ? (
                                          <img
                                            src={card.image_url}
                                            alt={card.name}
                                            style={{ width: "100%", height: "100%", borderRadius: 8, objectFit: "contain" }}
                                          />
                                        ) : (
                                          <Text size="xs" c="gray.5">No image available</Text>
                                        )}
                                      </Box>
                                    }
                                    color="transparent"
                                    withArrow={false}
                                    position="right"
                                    openDelay={150}
                                    styles={{
                                      tooltip: {
                                        padding: 0,
                                        backgroundColor: "transparent",
                                        border: "none",
                                        boxShadow: "none",
                                      }
                                    }}
                                  >
                                    <Text size="xs" style={{ cursor: "pointer", borderBottom: "1px dotted rgba(255, 255, 255, 0.4)", display: "inline-block" }}>
                                      {card.name}
                                    </Text>
                                  </Tooltip>
                                  {card.formats.includes("core") ? (
                                    <Badge size="10px" variant="outline" color="teal">
                                      Core
                                    </Badge>
                                  ) : (
                                    <Badge size="10px" variant="outline" color="orange">
                                      Infinity
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
    );
  };

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
          <Group gap="md" style={{ flex: 1, maxWidth: 600 }} align="end">
            <TextInput
              placeholder="Search meta decks..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            {user && (
              <Button
                variant="light"
                color="violet"
                leftSection={<IconUpload size={16} />}
                onClick={() => setImportModalOpen(true)}
              >
                Import Deck
              </Button>
            )}
          </Group>

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

        {/* Tabs for Core/Infinity Formats */}
        <Tabs defaultValue="core" color="violet" variant="outline" mt="md" mb="xl">
          <Tabs.List style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.15)" }} mb="md">
            <Tabs.Tab value="core" leftSection={<IconCards size={16} />} style={{ fontWeight: 600 }}>
              Core Constructed ({coreDecks.length})
            </Tabs.Tab>
            <Tabs.Tab value="infinity" leftSection={<IconInfinity size={16} />} style={{ fontWeight: 600 }}>
              Infinity Constructed ({infinityDecks.length})
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="core">
            {renderDeckList(coreDecks)}
          </Tabs.Panel>

          <Tabs.Panel value="infinity">
            {renderDeckList(infinityDecks)}
          </Tabs.Panel>
        </Tabs>
      </Container>

      {/* Import Deck Modal */}
      <Modal
        opened={importModalOpen}
        onClose={() => {
          setImportModalOpen(false);
          setImportTitle("");
          setImportText("");
          setParsedResults(null);
          setImportError(null);
        }}
        title={
          <Text fw={700} size="lg">
            Import Lorcana Deck List
          </Text>
        }
        size="lg"
        centered
        styles={{
          content: { backgroundColor: "var(--mantine-color-dark-8)", color: "var(--mantine-color-gray-1)" },
          header: { backgroundColor: "var(--mantine-color-dark-8)", color: "var(--mantine-color-gray-1)" },
        }}
      >
        <Stack gap="md">
          <Text size="xs" c="gray.4">
            Paste a decklist from Dreamborn.ink or Inkdecks.com. The parser supports quantities and card names (e.g. <code>4 Elsa - Spirit of Winter</code> or <code>4 Elsa - Spirit of Winter (001-042)</code>).
          </Text>

          <TextInput
            label="Deck Title"
            placeholder="e.g. Amber/Emerald Toys"
            required
            value={importTitle}
            onChange={(e) => setImportTitle(e.target.value)}
            styles={{ input: { backgroundColor: "var(--mantine-color-dark-9)" } }}
          />

          <Textarea
            label="Decklist Text"
            placeholder="Paste decklist here, e.g.&#10;4 Elsa - Spirit of Winter&#10;4 Koda - Talkative Cub (005-001)"
            minRows={8}
            required
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            styles={{ input: { backgroundColor: "var(--mantine-color-dark-9)", fontFamily: "monospace", fontSize: 12 } }}
          />

          {importError && (
            <Text size="xs" c="red.4" fw={500}>
              {importError}
            </Text>
          )}

          {parsedResults && (
            <Stack gap="xs" style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 12 }}>
              <Text size="sm" fw={600}>
                Parser Validation Summary:
              </Text>
              <Group gap="md">
                <Badge color="teal" variant="light">
                  {parsedResults.matched.reduce((acc, curr) => acc + curr.quantity, 0)} Cards Matched ({parsedResults.matched.length} Unique)
                </Badge>
                {parsedResults.unmatched.length > 0 && (
                  <Badge color="red" variant="light">
                    {parsedResults.unmatched.reduce((acc, curr) => acc + curr.quantity, 0)} Unknown Cards
                  </Badge>
                )}
              </Group>

              {parsedResults.unmatched.length > 0 && (
                <Box>
                  <Text size="xs" c="red.4" fw={500} mb={4}>
                    Warning: The following cards could not be found in the database (they will be skipped):
                  </Text>
                  <Box style={{ maxHeight: 100, overflowY: "auto", backgroundColor: "rgba(255,0,0,0.05)", padding: 8, borderRadius: 4 }}>
                    {parsedResults.unmatched.map((item, idx) => (
                      <Text key={idx} size="xs" c="gray.4" style={{ fontFamily: "monospace" }}>
                        - {item.quantity}x {item.name} {item.setCode ? `(${item.setCode})` : ""}
                      </Text>
                    ))}
                  </Box>
                </Box>
              )}
            </Stack>
          )}

          <Group justify="end" mt="md">
            <Button
              variant="outline"
              color="gray"
              onClick={() => {
                setImportModalOpen(false);
                setImportTitle("");
                setImportText("");
                setParsedResults(null);
                setImportError(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="light" color="blue" onClick={handleValidateImport}>
              Validate List
            </Button>
            <Button
              variant="filled"
              color="violet"
              disabled={!parsedResults || parsedResults.matched.length === 0}
              onClick={handleSubmitImport}
            >
              Import Deck
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
