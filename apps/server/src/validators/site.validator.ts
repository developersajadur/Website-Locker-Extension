import { z } from 'zod';

const CreateSiteSchema = z.object({
  body: z.object({
    url: z
      .string()
      .min(1, 'URL is required')
      .transform((val) => {
        // Normalize URL — strip protocol and trailing slash
        return val
          .replace(/^https?:\/\//, '')
          .replace(/^www\./, '')
          .replace(/\/$/, '')
          .toLowerCase();
      }),
    label: z.string().max(100).optional(),
  })
});

export const SiteValidation = {
  CreateSiteSchema,
};

export type CreateSiteInput = z.infer<typeof CreateSiteSchema>['body'];
