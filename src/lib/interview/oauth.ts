import { randomBytes } from "node:crypto";
import { decryptToken, encryptToken } from "./crypto";
import { prisma } from "@/lib/prisma";

/**
 * Read-only mailbox OAuth for Gmail and Outlook.
 *
 * Design constraints (see README):
 *  - explicit consent: the user clicks "Connect", then approves at the provider
 *  - minimal scopes: gmail.readonly / Mail.Read + offline_access
 *  - user-initiated search only; no background mailbox scanning
 *  - only the selected message body is fetched
 *  - tokens encrypted at rest, disconnect revokes and deletes them
 */

export type MailProvider = "google" | "microsoft";

export interface ProviderConfig {
  clientId: string;
  clientSecret: string;
  authUrl: string;
  tokenUrl: string;
  scope: string;
  tenant?: string;
}

export const PROVIDER_SCOPES: Record<MailProvider, string> = {
  google: "https://www.googleapis.com/auth/gmail.readonly openid email",
  microsoft: "offline_access openid email Mail.Read",
};

export function isProviderConfigured(provider: MailProvider): boolean {
  if (provider === "google") {
    return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  }
  return Boolean(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET);
}

export function providerConfig(provider: MailProvider): ProviderConfig {
  if (provider === "google") {
    if (!isProviderConfigured("google")) {
      throw new Error("Google mailbox access is not configured on this deployment.");
    }
    return {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      scope: PROVIDER_SCOPES.google,
    };
  }
  if (!isProviderConfigured("microsoft")) {
    throw new Error("Microsoft mailbox access is not configured on this deployment.");
  }
  const tenant = process.env.MICROSOFT_TENANT_ID || "common";
  return {
    clientId: process.env.MICROSOFT_CLIENT_ID as string,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
    authUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`,
    tokenUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    scope: PROVIDER_SCOPES.microsoft,
    tenant,
  };
}

export function callbackUrl(provider: MailProvider, origin: string): string {
  return `${origin}/api/interview/connections/${provider}/callback`;
}

export function newState(): string {
  return randomBytes(24).toString("base64url");
}

export function buildAuthUrl(provider: MailProvider, origin: string, state: string): string {
  const config = providerConfig(provider);
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: callbackUrl(provider, origin),
    response_type: "code",
    scope: config.scope,
    state,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "false",
  });
  return `${config.authUrl}?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
}

export async function exchangeCode(
  provider: MailProvider,
  origin: string,
  code: string,
): Promise<TokenResponse> {
  const config = providerConfig(provider);
  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: callbackUrl(provider, origin),
    }),
  });
  if (!response.ok) {
    throw new Error(`Token exchange failed (${response.status}).`);
  }
  return (await response.json()) as TokenResponse;
}

export async function refreshAccessToken(
  provider: MailProvider,
  refreshToken: string,
): Promise<TokenResponse> {
  const config = providerConfig(provider);
  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) {
    throw new Error(`Token refresh failed (${response.status}).`);
  }
  return (await response.json()) as TokenResponse;
}

/** Load a connection and return a usable access token (refreshing if needed). */
export async function accessTokenFor(
  professionalIdentityId: string,
  provider: MailProvider,
): Promise<{ token: string; accountEmail: string | null } | null> {
  const connection = await prisma.interviewEmailConnection.findUnique({
    where: { professionalIdentityId_provider: { professionalIdentityId, provider } },
  });
  if (!connection) return null;

  const expiresSoon =
    connection.tokenExpiresAt && connection.tokenExpiresAt.getTime() - Date.now() < 60_000;

  if (!expiresSoon) {
    return { token: decryptToken(connection.accessTokenEncrypted), accountEmail: connection.accountEmail };
  }

  if (!connection.refreshTokenEncrypted) {
    return null;
  }
  const refreshed = await refreshAccessToken(provider, decryptToken(connection.refreshTokenEncrypted));
  await prisma.interviewEmailConnection.update({
    where: { id: connection.id },
    data: {
      accessTokenEncrypted: encryptToken(refreshed.access_token),
      tokenExpiresAt: refreshed.expires_in
        ? new Date(Date.now() + refreshed.expires_in * 1000)
        : null,
      scope: refreshed.scope ?? connection.scope,
    },
  });
  return { token: refreshed.access_token, accountEmail: connection.accountEmail };
}

export interface MailSummary {
  id: string;
  subject: string;
  from: string;
  receivedAt: string | null;
  snippet: string;
}

/** Search the user's mailbox for interview invitations (user-initiated only). */
export async function searchMailbox(
  provider: MailProvider,
  token: string,
  query: string,
): Promise<MailSummary[]> {
  if (provider === "google") {
    const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
    listUrl.searchParams.set("q", query);
    listUrl.searchParams.set("maxResults", "10");
    const listResponse = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!listResponse.ok) throw new Error(`Gmail search failed (${listResponse.status}).`);
    const list = (await listResponse.json()) as { messages?: { id: string }[] };
    const results: MailSummary[] = [];
    for (const message of list.messages ?? []) {
      const metaUrl = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`);
      metaUrl.searchParams.set("format", "metadata");
      metaUrl.searchParams.append("metadataHeaders", "Subject");
      metaUrl.searchParams.append("metadataHeaders", "From");
      metaUrl.searchParams.append("metadataHeaders", "Date");
      const metaResponse = await fetch(metaUrl, { headers: { Authorization: `Bearer ${token}` } });
      if (!metaResponse.ok) continue;
      const meta = (await metaResponse.json()) as {
        id: string;
        snippet?: string;
        payload?: { headers?: { name: string; value: string }[] };
      };
      const header = (name: string) =>
        meta.payload?.headers?.find((entry) => entry.name.toLowerCase() === name)?.value ?? "";
      results.push({
        id: meta.id,
        subject: header("subject") || "(no subject)",
        from: header("from"),
        receivedAt: header("date") ? new Date(header("date")).toISOString() : null,
        snippet: meta.snippet ?? "",
      });
    }
    return results;
  }

  const url = new URL("https://graph.microsoft.com/v1.0/me/messages");
  url.searchParams.set("$search", `"${query.replace(/"/g, "")}"`);
  url.searchParams.set("$select", "id,subject,from,receivedDateTime,bodyPreview");
  url.searchParams.set("$top", "10");
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Outlook search failed (${response.status}).`);
  const data = (await response.json()) as {
    value?: { id: string; subject?: string; from?: { emailAddress?: { address?: string } }; receivedDateTime?: string; bodyPreview?: string }[];
  };
  return (data.value ?? []).map((message) => ({
    id: message.id,
    subject: message.subject || "(no subject)",
    from: message.from?.emailAddress?.address ?? "",
    receivedAt: message.receivedDateTime ?? null,
    snippet: message.bodyPreview ?? "",
  }));
}

/** Fetch the body of ONE selected message. */
export async function fetchMessage(
  provider: MailProvider,
  token: string,
  messageId: string,
): Promise<{ subject: string; from: string; receivedAt: string | null; body: string }> {
  if (provider === "google") {
    const url = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`);
    url.searchParams.set("format", "full");
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error(`Gmail message fetch failed (${response.status}).`);
    const data = (await response.json()) as {
      payload?: { headers?: { name: string; value: string }[]; body?: { data?: string }; parts?: unknown[] };
    };
    const header = (name: string) =>
      data.payload?.headers?.find((entry) => entry.name.toLowerCase() === name)?.value ?? "";

    const decode = (value?: string) =>
      value ? Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8") : "";

    const walk = (part: { mimeType?: string; body?: { data?: string }; parts?: unknown[] } | undefined): string => {
      if (!part) return "";
      if (part.mimeType === "text/plain" && part.body?.data) return decode(part.body.data);
      for (const child of (part.parts ?? []) as { mimeType?: string; body?: { data?: string }; parts?: unknown[] }[]) {
        const text = walk(child);
        if (text) return text;
      }
      return "";
    };

    const body = walk(data.payload as never) || decode(data.payload?.body?.data);
    return {
      subject: header("subject"),
      from: header("from"),
      receivedAt: header("date") ? new Date(header("date")).toISOString() : null,
      body,
    };
  }

  const url = new URL(`https://graph.microsoft.com/v1.0/me/messages/${messageId}`);
  url.searchParams.set("$select", "subject,from,receivedDateTime,body");
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Outlook message fetch failed (${response.status}).`);
  const data = (await response.json()) as {
    subject?: string;
    from?: { emailAddress?: { address?: string } };
    receivedDateTime?: string;
    body?: { content?: string; contentType?: string };
  };
  const raw = data.body?.content ?? "";
  const body = data.body?.contentType === "html" ? raw.replace(/<[^>]+>/g, " ") : raw;
  return {
    subject: data.subject ?? "",
    from: data.from?.emailAddress?.address ?? "",
    receivedAt: data.receivedDateTime ?? null,
    body,
  };
}

/** Disconnect: delete the stored tokens for this identity. */
export async function disconnect(professionalIdentityId: string, provider: MailProvider): Promise<void> {
  await prisma.interviewEmailConnection.deleteMany({
    where: { professionalIdentityId, provider },
  });
}
