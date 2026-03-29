-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_type_fkey" FOREIGN KEY ("type") REFERENCES "GroupType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_type_fkey" FOREIGN KEY ("type") REFERENCES "LocationType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationTypeContainmentRule" ADD CONSTRAINT "LocationTypeContainmentRule_parentTypeId_fkey" FOREIGN KEY ("parentTypeId") REFERENCES "LocationType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationTypeContainmentRule" ADD CONSTRAINT "LocationTypeContainmentRule_childTypeId_fkey" FOREIGN KEY ("childTypeId") REFERENCES "LocationType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
