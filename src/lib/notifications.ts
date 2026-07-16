import prisma from "./prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const p = prisma as any;

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: string;
  referenceId?: string;
  referenceType?: string;
}

/**
 * Buat notifikasi untuk satu user
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    return await p.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        referenceId: params.referenceId ?? null,
        referenceType: params.referenceType ?? null,
      },
    });
  } catch (error) {
    console.error("[Notification] Gagal buat notifikasi:", error);
    return null;
  }
}

/**
 * Buat notifikasi untuk semua user dengan role tertentu
 */
export async function createNotificationsForRoles(
  roles: string[],
  data: Omit<CreateNotificationParams, "userId">
) {
  try {
    const users = await p.user.findMany({
      where: { role: { in: roles } },
      select: { id: true },
    });

    if (users.length === 0) return [];

    const notifications = await p.notification.createMany({
      data: users.map((user: { id: string }) => ({
        userId: user.id,
        title: data.title,
        message: data.message,
        type: data.type,
        referenceId: data.referenceId ?? null,
        referenceType: data.referenceType ?? null,
      })),
    });

    return notifications;
  } catch (error) {
    console.error("[Notification] Gagal buat notifikasi massal:", error);
    return [];
  }
}

/**
 * Buat notifikasi untuk multiple user IDs
 */
export async function createNotificationsForUsers(
  userIds: string[],
  data: Omit<CreateNotificationParams, "userId">
) {
  try {
    if (userIds.length === 0) return [];

    const validIds = [...new Set(userIds.filter(Boolean))];

    const notifications = await p.notification.createMany({
      data: validIds.map((userId) => ({
        userId,
        title: data.title,
        message: data.message,
        type: data.type,
        referenceId: data.referenceId ?? null,
        referenceType: data.referenceType ?? null,
      })),
    });

    return notifications;
  } catch (error) {
    console.error("[Notification] Gagal buat notifikasi ke users:", error);
    return [];
  }
}

/**
 * Ambil jumlah notifikasi belum dibaca untuk user
 */
export async function getUnreadCount(userId: string) {
  try {
    return await p.notification.count({
      where: { userId, isRead: false },
    });
  } catch {
    return 0;
  }
}