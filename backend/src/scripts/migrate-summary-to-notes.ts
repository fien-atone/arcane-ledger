/**
 * One-time migration: copy Session.summary → SessionNote for the GM user.
 * Run: npx tsx src/scripts/migrate-summary-to-notes.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get all sessions with non-empty summary
  const sessions = await prisma.session.findMany({
    where: { summary: { not: '' } },
    select: { id: true, campaignId: true, summary: true },
  });

  console.log(`Found ${sessions.length} sessions with summary`);

  for (const session of sessions) {
    // Find GM of this campaign
    const gmMember = await prisma.campaignMember.findFirst({
      where: { campaignId: session.campaignId, role: 'GM' },
      select: { userId: true },
    });

    if (!gmMember) {
      console.log(`  Session ${session.id}: no GM found, skipping`);
      continue;
    }

    // Check if GM already has a note for this session
    const existing = await prisma.sessionNote.findUnique({
      where: { sessionId_userId: { sessionId: session.id, userId: gmMember.userId } },
    });

    if (existing && existing.content) {
      console.log(`  Session ${session.id}: GM already has note, skipping`);
      continue;
    }

    // Upsert: create or update GM's note with summary content
    await prisma.sessionNote.upsert({
      where: { sessionId_userId: { sessionId: session.id, userId: gmMember.userId } },
      create: { sessionId: session.id, userId: gmMember.userId, content: session.summary },
      update: { content: session.summary },
    });

    console.log(`  Session ${session.id}: migrated summary → GM note`);
  }

  console.log('Migration complete!');
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
