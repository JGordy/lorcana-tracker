import { Link, useLocation, useSubmit } from "react-router";
import { Container, Group, Button, Text, Box, Menu, Avatar } from "@mantine/core";
import { IconLogout, IconCards, IconDatabase, IconUser } from "@tabler/icons-react";

interface NavbarProps {
  user: {
    $id: string;
    email: string;
    name: string;
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const location = useLocation();
  const submit = useSubmit();

  const handleLogout = () => {
    submit({ intent: "logout" }, { method: "post", replace: true });
  };

  const handleLoginDemo = () => {
    submit({ intent: "login-demo" }, { method: "post", replace: true });
  };

  return (
    <Box
      component="header"
      style={(theme) => ({
        position: "sticky",
        top: 0,
        zIndex: 100,
        backgroundColor: "rgba(10, 10, 10, 0.8)",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid rgba(255, 255, 255, 0.06)`,
      })}
    >
      <Container size="lg" style={{ height: 64, display: "flex", alignItems: "center" }}>
        <Group justify="between" w="100%" align="center">
          {/* Logo and Nav links */}
          <Group gap="xl">
            <Link to="/" style={{ textDecoration: "none", outline: "none", display: "flex", alignItems: "center" }}>
              <Group gap={8} align="center" wrap="nowrap">
                <img
                  src="/icon-transparent.png"
                  alt="GlimmerForge"
                  style={{ height: 40, width: "auto", display: "block", border: 0, outline: "none", flexShrink: 0 }}
                />
                <Text
                  size="lg"
                  fw={700}
                  style={{
                    fontFamily: "'Cinzel Decorative', serif",
                    letterSpacing: "0.5px",
                    background: "linear-gradient(to right, #a78bfa, #ec4899, #f43f5e)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  GlimmerForge
                </Text>
              </Group>
            </Link>

            {/* Desktop Navigation */}
            <Group gap="sm" visibleFrom="md">
              <Button
                component={Link}
                to="/decks"
                variant={location.pathname === "/decks" ? "light" : "subtle"}
                color={location.pathname === "/decks" ? "violet" : "gray"}
                size="xs"
                leftSection={<IconDatabase size={16} />}
              >
                Deck Directory
              </Button>
              <Button
                component={Link}
                to="/collection"
                variant={location.pathname === "/collection" ? "light" : "subtle"}
                color={location.pathname === "/collection" ? "violet" : "gray"}
                size="xs"
                leftSection={<IconCards size={16} />}
              >
                My Collection
              </Button>
            </Group>
          </Group>

          {/* User Auth Section */}
          <Group gap="md">
            {/* Mobile Navigation Toggles */}
            <Group gap={6} hiddenFrom="md">
              <Button
                component={Link}
                to="/decks"
                variant={location.pathname === "/decks" ? "light" : "subtle"}
                color={location.pathname === "/decks" ? "violet" : "gray"}
                size="xs"
                px="xs"
              >
                Decks
              </Button>
              <Button
                component={Link}
                to="/collection"
                variant={location.pathname === "/collection" ? "light" : "subtle"}
                color={location.pathname === "/collection" ? "violet" : "gray"}
                size="xs"
                px="xs"
              >
                Collection
              </Button>
            </Group>

            {user ? (
              <Group gap="xs">
                <Box visibleFrom="sm" style={{ textAlign: "right" }}>
                  <Text size="xs" fw={700} c="gray.2">
                    {user.name}
                  </Text>
                  <Text size="10px" c="violet.4">
                    Sync Active
                  </Text>
                </Box>
                <Menu shadow="md" width={200} trigger="click" position="bottom-end">
                  <Menu.Target>
                    <Avatar color="violet" radius="xl" size="sm" style={{ cursor: "pointer" }}>
                      <IconUser size={16} />
                    </Avatar>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Label>Session ({user.email})</Menu.Label>
                    <Menu.Item
                      color="red"
                      leftSection={<IconLogout size={14} />}
                      onClick={handleLogout}
                    >
                      Sign Out
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
            ) : (
              <Group gap="xs">
                <Text size="xs" c="gray.5" visibleFrom="sm">
                  Guest Mode
                </Text>
                <Button
                  onClick={handleLoginDemo}
                  variant="gradient"
                  gradient={{ from: "violet.6", to: "indigo.6" }}
                  size="xs"
                  fw={700}
                >
                  Sign In (Demo)
                </Button>
              </Group>
            )}
          </Group>
        </Group>
      </Container>
    </Box>
  );
}
