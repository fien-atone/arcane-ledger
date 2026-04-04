-- CreateTable
CREATE TABLE "CharacterGroupMembership" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "relation" TEXT,
    "subfaction" TEXT,

    CONSTRAINT "CharacterGroupMembership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CharacterGroupMembership_characterId_groupId_key" ON "CharacterGroupMembership"("characterId", "groupId");

-- AddForeignKey
ALTER TABLE "CharacterGroupMembership" ADD CONSTRAINT "CharacterGroupMembership_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "PlayerCharacter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterGroupMembership" ADD CONSTRAINT "CharacterGroupMembership_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
