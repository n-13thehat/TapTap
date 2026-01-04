import { BmiSyncStatus } from "@prisma/client";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

const BMI_OAUTH_AUTHORIZE_URL = process.env.BMI_OAUTH_AUTHORIZE_URL ?? "https://www.bmi.com/oauth/authorize";
const BMI_OAUTH_TOKEN_URL = process.env.BMI_OAUTH_TOKEN_URL;
const BMI_CLIENT_ID = process.env.BMI_CLIENT_ID ?? "";
const BMI_CLIENT_SECRET = process.env.BMI_CLIENT_SECRET ?? "";
const BMI_OAUTH_REDIRECT_URI =
  process.env.BMI_OAUTH_REDIRECT_URI ?? "http://localhost:3000/api/creator/bmi/callback";
const BMI_OAUTH_SCOPE = process.env.BMI_OAUTH_SCOPE ?? "catalog profile";
const BMI_API_BASE = process.env.BMI_API_BASE;
const BMI_TRACK_REGISTER_URL =
  process.env.BMI_TRACK_REGISTER_URL ?? (BMI_API_BASE ? `${BMI_API_BASE.replace(/\/$/, "")}/tracks/register` : undefined);
const BMI_PERFORMANCE_REPORT_URL =
  process.env.BMI_PERFORMANCE_REPORT_URL ?? (BMI_API_BASE ? `${BMI_API_BASE.replace(/\/$/, "")}/performances` : undefined);

export type BmiTrackPayload = {
  trackId: string;
  title: string;
  priceCents?: number | null;
  coverUrl?: string | null;
  audioUrl?: string | null;
  durationMs?: number | null;
  mintedAt?: string | null;
  metadata?: any;
};

export type BmiPerformancePayload = {
  title: string;
  streamDate: string;
  durationMinutes: number;
  audienceCount: number;
  meta?: any;
};

export async function createBmiOAuthState(userId: string) {
  const state = randomUUID();
  await prisma.bmiOAuthState.create({ data: { userId, state } });
  return state;
}

export async function buildBmiAuthUrl(userId: string) {
  const state = await createBmiOAuthState(userId);
  const url = new URL(BMI_OAUTH_AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  if (BMI_CLIENT_ID) url.searchParams.set("client_id", BMI_CLIENT_ID);
  url.searchParams.set("redirect_uri", BMI_OAUTH_REDIRECT_URI);
  url.searchParams.set("scope", BMI_OAUTH_SCOPE);
  url.searchParams.set("state", state);
  return url.toString();
}

export async function consumeBmiState(state: string) {
  const record = await prisma.bmiOAuthState.findUnique({ where: { state } });
  if (!record) return null;
  await prisma.bmiOAuthState.delete({ where: { state } });
  return record;
}

export async function exchangeBmiCodeForTokens(code: string) {
  if (!BMI_OAUTH_TOKEN_URL) {
    return {
      accessToken: `demo-${code}`,
      refreshToken: null,
      expiresAt: null,
    };
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: BMI_OAUTH_REDIRECT_URI,
    client_id: BMI_CLIENT_ID,
    client_secret: BMI_CLIENT_SECRET,
  });

  const response = await fetch(BMI_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`BMI token exchange failed: ${message}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt: typeof data.expires_in === "number" ? new Date(Date.now() + data.expires_in * 1000) : null,
  };
}

export async function upsertBmiConnection(
  userId: string,
  tokens: {
    accessToken: string;
    refreshToken?: string | null;
    expiresAt?: Date | null;
  }
) {
  return prisma.bmiConnection.upsert({
    where: { userId },
    create: {
      userId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      connectedAt: new Date(),
    },
    update: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      connectedAt: new Date(),
    },
  });
}

export async function getBmiConnection(userId: string) {
  return prisma.bmiConnection.findUnique({ where: { userId } });
}

async function fetchBmiSink(url: string, payload: any, token: string) {
  return fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function registerTrackWithBmi(userId: string, payload: BmiTrackPayload) {
  const connection = await getBmiConnection(userId);
  if (!connection?.accessToken) {
    throw new Error("Please connect your BMI account before registering a track.");
  }

  const registration = await prisma.bmiTrackRegistration.create({
    data: {
      userId,
      trackId: payload.trackId,
      payload,
      status: BmiSyncStatus.PENDING,
    },
  });

  if (!BMI_TRACK_REGISTER_URL) {
    await prisma.bmiTrackRegistration.update({
      where: { id: registration.id },
      data: {
        status: BmiSyncStatus.SYNCED,
        response: { mock: true },
      },
    });
    return registration;
  }

  try {
    const response = await fetchBmiSink(BMI_TRACK_REGISTER_URL, payload, connection.accessToken);
    const body = await response.json().catch(() => null);
    await prisma.bmiTrackRegistration.update({
      where: { id: registration.id },
      data: {
        status: response.ok ? BmiSyncStatus.SYNCED : BmiSyncStatus.FAILED,
        response: body,
      },
    });
    return registration;
  } catch (error) {
    await prisma.bmiTrackRegistration.update({
      where: { id: registration.id },
      data: {
        status: BmiSyncStatus.FAILED,
        response: { error: (error as Error).message },
      },
    });
    throw error;
  }
}

export async function logBmiPerformance(userId: string, payload: BmiPerformancePayload) {
  const connection = await getBmiConnection(userId);
  if (!connection?.accessToken) {
    throw new Error("Connect with BMI before pushing live performance data.");
  }

  const log = await prisma.bmiPerformanceLog.create({
    data: {
      userId,
      title: payload.title,
      streamDate: new Date(payload.streamDate),
      durationMinutes: payload.durationMinutes,
      audienceCount: payload.audienceCount,
      payload,
    },
  });

  if (!BMI_PERFORMANCE_REPORT_URL) {
    await prisma.bmiPerformanceLog.update({
      where: { id: log.id },
      data: { syncedAt: new Date() },
    });
    return log;
  }

  try {
    const response = await fetchBmiSink(BMI_PERFORMANCE_REPORT_URL, payload, connection.accessToken);
    const body = await response.json().catch(() => null);
    await prisma.bmiPerformanceLog.update({
      where: { id: log.id },
      data: {
        syncedAt: response.ok ? new Date() : null,
        payload: { ...payload, response: body },
      },
    });
    return log;
  } catch (error) {
    await prisma.bmiPerformanceLog.update({
      where: { id: log.id },
      data: {
        payload: { ...payload, error: (error as Error).message },
      },
    });
    throw error;
  }
}
