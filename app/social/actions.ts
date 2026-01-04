"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/lib/prisma";

// Supabase user helper (server)
async function getUserId() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !anon) throw new Error("Supabase env missing");
  const cookieStore = await cookies();
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookies) => {
        for (const cookie of cookies || []) {
          cookieStore.set(cookie.name, cookie.value, cookie.options);
        }
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// Create a post from a form
export async function createPostAction(formData: FormData) {
  const userId = await getUserId();
  if (!userId) throw new Error("Sign in to post");

  const text = (formData.get("text") as string)?.trim();
  if (!text) throw new Error("Post cannot be empty");

  await prisma.post.create({
    data: {
      userId,
      text,
    },
  });

  revalidatePath("/social");
}

// Toggle like via form (hidden input: postId)
export async function toggleLikeAction(formData: FormData) {
  const userId = await getUserId();
  if (!userId) throw new Error("Sign in to like");

  const postId = (formData.get("postId") as string) ?? "";
  if (!postId) throw new Error("Missing postId");

  let target = await prisma.likeTarget.findFirst({
    where: { postId, type: "POST" },
    select: { id: true },
  });
  if (!target) {
    target = await prisma.likeTarget.create({
      data: { postId, type: "POST" },
      select: { id: true },
    });
  }

  const existing = await prisma.like.findFirst({
    where: { userId, targetId: target.id },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    await prisma.like.create({ data: { userId, targetId: target.id } });
  }

  revalidatePath("/social");
}

// Create a trade via form (hidden inputs: receiverId, offeredTrackId)
export async function createTradeAction(formData: FormData) {
  const userId = await getUserId();
  if (!userId) throw new Error("Sign in to trade");

  const receiverId    = (formData.get("receiverId") as string) ?? "";
  const offeredTrackId = (formData.get("offeredTrackId") as string) ?? "";
  if (!receiverId || !offeredTrackId) throw new Error("Missing trade fields");

  await prisma.trade.create({
    data: {
      initiatorId: userId,
      receiverId: receiverId,
      status: "PENDING",
      items: { offeredTrackId },
    },
  });

  revalidatePath("/social");
}

// Legacy helpers for ClientIslands (stubbed)
export { createPostAction as createPost };
export async function followUser(formData: FormData) {
  const targetId = (formData.get("userId") as string) ?? "";
  if (!targetId) throw new Error("userId required");
  return followAction(targetId);
}
export { sendMessageAction as sendMessage };
export { updateBioAction as updateBio };

export async function toggleLike(formData: FormData) {
  return toggleLikeAction(formData);
}

export async function addComment(formData: FormData) {
  console.warn("addComment action is not implemented yet", formData);
  return { ok: true };
}

export async function deletePost(formData: FormData) {
  console.warn("deletePost action is not implemented yet", formData);
  return { ok: true };
}

export async function restorePost(formData: FormData) {
  console.warn("restorePost action is not implemented yet", formData);
  return { ok: true };
}

export async function sendTip(formData: FormData) {
  console.warn("sendTip action is not implemented yet", formData);
  return { ok: true };
}

export async function followAction(userId: string) {
  const meId = await getUserId();
  if (!meId) throw new Error("Sign in to follow");
  if (meId === userId) return;
  const already = await prisma.follow.findFirst({ where: { followerId: meId, followingId: userId } });
  if (already) {
    await prisma.follow.delete({ where: { id: already.id } });
  } else {
    await prisma.follow.create({ data: { followerId: meId, followingId: userId } });
  }
  revalidatePath("/social");
}

export async function sendMessageAction(input: { conversationId?: string; toUserId?: string; text: string }) {
  const meId = await getUserId();
  if (!meId) throw new Error("Sign in to send messages");
  const text = input.text.trim();
  if (!text) return;

  let convoId = input.conversationId;
  if (!convoId && input.toUserId) {
    const existing = await prisma.chat.findFirst({
      where: {
        participants: { some: { userId: meId } },
      },
      select: { id: true, participants: { select: { userId: true } } },
    });
    if (existing && existing.participants.some((p) => p.userId === input.toUserId)) {
      convoId = existing.id;
    } else {
      const created = await prisma.chat.create({ data: {} });
      convoId = created.id;
      await prisma.chatParticipant.upsert({
        where: { chatId_userId: { chatId: convoId, userId: meId } },
        update: {},
        create: { chatId: convoId, userId: meId },
      });
      await prisma.chatParticipant.upsert({
        where: { chatId_userId: { chatId: convoId, userId: input.toUserId } },
        update: {},
        create: { chatId: convoId, userId: input.toUserId },
      });
    }
  }
  if (!convoId) throw new Error("No conversation");

  await prisma.message.create({ data: { chatId: convoId, senderId: meId, text } });
  await prisma.chat.update({ where: { id: convoId }, data: { updatedAt: new Date() } });
  revalidatePath("/social");
}

export async function updateBioAction(formData: FormData) {
  const meId = await getUserId();
  if (!meId) throw new Error("Sign in to update your bio");
  const bio = (formData.get("bio") as string)?.slice(0, 160) ?? null;
  await prisma.user.update({ where: { id: meId }, data: { bio } });
  revalidatePath("/social");
}
