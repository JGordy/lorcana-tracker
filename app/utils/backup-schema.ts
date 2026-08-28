import { z } from 'zod';

export const BackupSchema = z.object({
    version: z.literal(1),
    exported_at: z.string(),
    collection: z.record(
        z.string(),
        z.object({
            normal: z.number().int().nonnegative(),
            foil: z.number().int().nonnegative(),
        }),
    ),
    decks: z
        .array(
            z.object({
                title: z.string(),
                cards: z.array(
                    z.object({
                        card_id: z.string(),
                        quantity: z.number().int().positive(),
                    }),
                ),
            }),
        )
        .optional(),
});

export type BackupPayload = z.infer<typeof BackupSchema>;

export function parseAndValidateBackup(jsonString: string): BackupPayload {
    const raw = JSON.parse(jsonString);
    return BackupSchema.parse(raw);
}
