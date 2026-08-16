import { useState } from "react";
import { useFetcher } from "react-router";
import {
  Modal,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Text,
  Anchor,
  Alert,
  Group,
} from "@mantine/core";
import { IconAlertCircle, IconCheck, IconMail } from "@tabler/icons-react";

interface AuthModalProps {
  opened: boolean;
  onClose: () => void;
}

export function AuthModal({ opened, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const fetcher = useFetcher();

  const isSubmitting = fetcher.state === "submitting";
  const actionData: any = fetcher.data;
  const isRegisteredSuccess = mode === "register" && actionData?.success;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={700} size="md" c="gray.1">
          {mode === "login" ? "Sign In to GlimmerForge" : "Create GlimmerForge Account"}
        </Text>
      }
      centered
      radius="md"
      overlayProps={{ backgroundOpacity: 0.6, blur: 4 }}
      styles={{
        content: {
          backgroundColor: "#141517",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },
        header: {
          backgroundColor: "#141517",
        },
      }}
    >
      {isRegisteredSuccess ? (
        <Stack gap="md" py="xs">
          <Alert
            icon={<IconCheck size={18} />}
            title="Account Created!"
            color="teal"
            radius="md"
          >
            We&apos;ve sent a verification link to your email address. Please click the link to verify your account!
          </Alert>
          <Button fullWidth onClick={onClose} variant="light" color="violet">
            Done
          </Button>
        </Stack>
      ) : (
        <fetcher.Form method="post" action="/?index">
          <input type="hidden" name="intent" value={mode === "login" ? "auth-login" : "auth-register"} />

          <Stack gap="sm">
            {actionData?.error && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md">
                {actionData.error}
              </Alert>
            )}

            {mode === "register" && (
              <TextInput
                label="Full Name"
                name="name"
                placeholder="Illumineer Mickey"
                required
                radius="md"
              />
            )}

            <TextInput
              label="Email Address"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              radius="md"
              leftSection={<IconMail size={16} />}
            />

            <PasswordInput
              label="Password"
              name="password"
              placeholder="Minimum 8 characters"
              required
              radius="md"
            />

            <Button
              type="submit"
              fullWidth
              mt="xs"
              loading={isSubmitting}
              variant="gradient"
              gradient={{ from: "violet.6", to: "indigo.6" }}
            >
              {mode === "login" ? "Sign In" : "Create Account & Send Verification"}
            </Button>

            <Group justify="center" mt="xs">
              <Text size="xs" c="gray.5">
                {mode === "login" ? "Don't have an account?" : "Already have an account?"}
              </Text>
              <Anchor
                component="button"
                type="button"
                size="xs"
                c="violet.4"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
              >
                {mode === "login" ? "Create Account" : "Sign In"}
              </Anchor>
            </Group>
          </Stack>
        </fetcher.Form>
      )}
    </Modal>
  );
}
