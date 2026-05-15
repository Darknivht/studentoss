# 05 — Edge Functions

**Zero changes.** The mobile client calls the same edge functions as the web client.

## How to call

Same API as web:

```ts
const { data, error } = await supabase.functions.invoke('ai-study', {
  body: { mode: 'chat', messages, noteContext },
});
```

## Edge functions in use

From `supabase/functions/`:

| Function | Used for |
|---|---|
| `ai-study` | All AI: chat, summary, quiz gen, flashcards, mind map, debate, mnemonic, fill-blanks, etc. |
| `exam-practice` | Generate / fetch exam MCQs |
| `extract-pdf-text` + `extract-pdf-text-ocr` | Note ingestion |
| `verify-payment` | Paystack server-side verification |
| `job-search` | RapidAPI proxy for jobs |
| `admin-resources` | Admin store management |
| `admin-verify` | Admin password gate |

## Auth header

Supabase JS auto-attaches the user's JWT. RLS on the edge function side reads `auth.uid()` correctly. No changes.

## Long-running calls

Some AI calls take 20–30s. The `resilientFetch.ts` lib (already copied) handles retries. Apply 30s timeout same as web.

## Acceptance

- [ ] Tutor chat returns a response
- [ ] Quiz generation from a note works end-to-end
- [ ] `verify-payment` correctly upgrades subscription tier after Paystack callback
