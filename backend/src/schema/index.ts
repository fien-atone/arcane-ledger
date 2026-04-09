export const typeDefs = `#graphql

  # ── Enums ───────────────────────────────────────────────────

  enum SystemRole { ADMIN USER }
  enum CampaignRole { GM PLAYER }
  enum NPCStatus { ALIVE DEAD MISSING UNKNOWN }
  enum Gender { MALE FEMALE NONBINARY }
  enum QuestStatus { ACTIVE COMPLETED FAILED UNAVAILABLE UNDISCOVERED }
  enum InvitationStatus { PENDING ACCEPTED DECLINED }

  # ── Auth ────────────────────────────────────────────────────

  type User {
    id: ID!
    email: String!
    name: String!
    avatar: String
    role: SystemRole!
    createdAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  # ── Campaign ───────────────────────────────────────────────

  type Campaign {
    id: ID!
    title: String!
    description: String
    enabledSections: [String!]!
    createdAt: String!
    archivedAt: String
    myRole: CampaignRole!
    sessionCount: Int!
    memberCount: Int!
    lastSession: Session
    sessions: [Session!]!
    npcs: [NPC!]!
    quests: [Quest!]!
    groups: [Group!]!
    locations: [Location!]!
    characters: [PlayerCharacter!]!
  }

  type CampaignMember {
    id: ID!
    user: User!
    role: CampaignRole!
    joinedAt: String!
  }

  type CampaignInvitation {
    id: ID!
    campaignId: ID!
    campaign: Campaign!
    user: User!
    invitedBy: User!
    status: InvitationStatus!
    createdAt: String!
    respondedAt: String
  }

  type PartySlot {
    member: CampaignMember
    character: PlayerCharacter
    invitation: CampaignInvitation
  }

  # ── Session ────────────────────────────────────────────────

  type SessionNote {
    id: ID!
    sessionId: ID!
    userId: ID!
    content: String!
    updatedAt: String!
  }

  type Session {
    id: ID!
    campaignId: ID!
    number: Int!
    title: String!
    datetime: String!
    brief: String
    summary: String!
    createdAt: String!
    npcs: [NPC!]!
    locations: [Location!]!
    quests: [Quest!]!
    myNote: SessionNote
  }

  # ── NPC ────────────────────────────────────────────────────

  type NPCLocationPresence {
    locationId: ID!
    location: Location!
    note: String
    playerVisible: Boolean!
  }

  type NPCGroupMembership {
    groupId: ID!
    group: Group!
    relation: String
    subfaction: String
    playerVisible: Boolean!
  }

  type NPC {
    id: ID!
    campaignId: ID!
    name: String!
    aliases: [String!]!
    status: NPCStatus!
    gender: Gender
    age: Int
    species: String
    speciesId: String
    appearance: String
    personality: String
    description: String!
    motivation: String
    flaws: String
    gmNotes: String
    image: String
    createdAt: String!
    updatedAt: String!
    playerVisible: Boolean!
    playerVisibleFields: [String!]!
    locationPresences: [NPCLocationPresence!]!
    groupMemberships: [NPCGroupMembership!]!
    sessions: [Session!]!
    questsGiven: [Quest!]!
  }

  # ── Player Character ───────────────────────────────────────

  type CharacterGroupMembership {
    characterId: ID!
    groupId: ID!
    group: Group!
    relation: String
    subfaction: String
  }

  type PlayerCharacter {
    id: ID!
    campaignId: ID!
    userId: ID
    player: User
    name: String!
    gender: Gender
    age: Int
    species: String
    speciesId: String
    class: String
    appearance: String
    background: String
    personality: String
    motivation: String
    bonds: String
    flaws: String
    gmNotes: String!
    image: String
    createdAt: String!
    updatedAt: String!
    groupMemberships: [CharacterGroupMembership!]!
  }

  # ── Quest ──────────────────────────────────────────────────

  type Quest {
    id: ID!
    campaignId: ID!
    title: String!
    description: String!
    giver: NPC
    giverId: String
    reward: String
    status: QuestStatus!
    notes: String!
    createdAt: String!
    sessions: [Session!]!
    playerVisible: Boolean!
    playerVisibleFields: [String!]!
  }

  # ── Group ──────────────────────────────────────────────────

  type Group {
    id: ID!
    campaignId: ID!
    name: String!
    type: String
    aliases: [String!]!
    description: String!
    goals: String
    symbols: String
    gmNotes: String
    partyRelation: String
    createdAt: String!
    updatedAt: String!
    playerVisible: Boolean!
    playerVisibleFields: [String!]!
    members: [NPCGroupMembership!]!
  }

  # ── Location ───────────────────────────────────────────────

  type MapMarker {
    id: ID!
    x: Float!
    y: Float!
    label: String!
    linkedLocationId: String
    linkedNpcId: String
  }

  type Location {
    id: ID!
    campaignId: ID!
    name: String!
    type: String
    settlementPopulation: Int
    biome: String
    parentLocationId: String
    parentLocation: Location
    description: String!
    image: String
    gmNotes: String
    mapMarkers: [MapMarker!]!
    createdAt: String!
    playerVisible: Boolean!
    playerVisibleFields: [String!]!
    children: [Location!]!
    npcsHere: [NPC!]!
  }

  # ── Location Types ─────────────────────────────────────────

  type LocationType {
    id: ID!
    name: String!
    icon: String!
    category: String!
    biomeOptions: [String!]!
    isSettlement: Boolean!
    builtin: Boolean!
  }

  type LocationTypeContainmentRule {
    id: ID!
    parentTypeId: String!
    childTypeId: String!
  }

  # ── Group Types ────────────────────────────────────────────

  type GroupType {
    id: ID!
    campaignId: ID!
    name: String!
    icon: String!
    description: String
  }

  # ── Species Types ─────────────────────────────────────────

  type SpeciesType {
    id: ID!
    campaignId: ID!
    name: String!
    icon: String!
    description: String
  }

  # ── Species ────────────────────────────────────────────────

  type Species {
    id: ID!
    campaignId: ID!
    name: String!
    pluralName: String
    type: String!
    size: String!
    description: String
    traits: [String!]!
    image: String
  }

  # ── Relations ──────────────────────────────────────────────

  type EntityRef {
    type: String!
    id: ID!
  }

  type Relation {
    id: ID!
    campaignId: ID!
    fromEntity: EntityRef!
    toEntity: EntityRef!
    friendliness: Int!
    note: String
    createdAt: String!
    updatedAt: String!
  }

  # ── Queries ────────────────────────────────────────────────

  type Query {
    # Auth
    me: User

    # Campaigns
    campaigns: [Campaign!]!
    campaign(id: ID!): Campaign

    # Sessions
    sessions(campaignId: ID!, search: String): [Session!]!
    session(campaignId: ID!, id: ID!): Session

    # NPCs
    npcs(campaignId: ID!, search: String, status: String): [NPC!]!
    npc(campaignId: ID!, id: ID!): NPC

    # Characters
    party(campaignId: ID!): [PlayerCharacter!]!

    # Party & Invitations
    partySlots(campaignId: ID!): [PartySlot!]!
    myInvitations: [CampaignInvitation!]!
    campaignInvitations(campaignId: ID!): [CampaignInvitation!]!
    searchUsers(campaignId: ID!, query: String!): [User!]!

    # Quests
    quests(campaignId: ID!, search: String, status: String): [Quest!]!
    quest(campaignId: ID!, id: ID!): Quest

    # Groups
    groups(campaignId: ID!, search: String, type: String): [Group!]!
    group(campaignId: ID!, id: ID!): Group

    # Locations
    locations(campaignId: ID!, search: String, type: String): [Location!]!
    location(campaignId: ID!, id: ID!): Location

    # Location Types
    locationTypes(campaignId: ID!): [LocationType!]!
    containmentRules: [LocationTypeContainmentRule!]!

    # Group Types
    groupTypes(campaignId: ID!, search: String): [GroupType!]!

    # Species Types
    speciesTypes(campaignId: ID!, search: String): [SpeciesType!]!

    # Species
    species(campaignId: ID!, search: String, type: String): [Species!]!

    # Relations
    relationsForEntity(campaignId: ID!, entityId: ID!): [Relation!]!
    relationsForCampaign(campaignId: ID!): [Relation!]!

    # Admin
    adminUsers(search: String): [User!]!
  }

  # ── Mutations ──────────────────────────────────────────────

  input SessionInput {
    number: Int!
    title: String!
    datetime: String
    brief: String
    summary: String
    npcIds: [ID!]
    locationIds: [ID!]
    questIds: [ID!]
  }

  input NPCInput {
    name: String!
    aliases: [String!]
    status: NPCStatus
    gender: Gender
    age: Int
    species: String
    speciesId: String
    appearance: String
    personality: String
    description: String
    motivation: String
    flaws: String
    gmNotes: String
    image: String
  }

  input QuestInput {
    title: String!
    description: String
    giverId: String
    reward: String
    status: QuestStatus
    notes: String
  }

  input GroupInput {
    name: String!
    type: String
    aliases: [String!]
    description: String
    goals: String
    symbols: String
    gmNotes: String
    partyRelation: String
  }

  input LocationInput {
    name: String!
    type: String
    settlementPopulation: Int
    biome: String
    parentLocationId: String
    description: String
    image: String
    gmNotes: String
    mapMarkers: String # JSON string
  }

  input AdminCreateUserInput {
    name: String!
    email: String!
    password: String!
    role: SystemRole
  }

  input AdminUpdateUserInput {
    name: String
    email: String
    password: String
    role: SystemRole
  }

  input SetEntityVisibilityInput {
    playerVisible: Boolean!
    playerVisibleFields: [String!]!
  }

  input RelationInput {
    fromEntityType: String!
    fromEntityId: ID!
    toEntityType: String!
    toEntityId: ID!
    friendliness: Int!
    note: String
  }

  type Mutation {
    # Auth
    login(email: String!, password: String!): AuthPayload!
    updateProfile(name: String!): User!
    changePassword(currentPassword: String!, newPassword: String!, confirmPassword: String!): Boolean!

    # Campaigns
    createCampaign(title: String!, description: String): Campaign!
    updateCampaign(id: ID!, title: String, description: String, archivedAt: String): Campaign!
    updateCampaignSections(campaignId: ID!, sections: [String!]!): Campaign!

    # Sessions
    saveSession(campaignId: ID!, id: ID, input: SessionInput!): Session!
    deleteSession(campaignId: ID!, id: ID!): Boolean!

    # NPCs
    saveNPC(campaignId: ID!, id: ID, input: NPCInput!): NPC!
    deleteNPC(campaignId: ID!, id: ID!): Boolean!

    # Quests
    saveQuest(campaignId: ID!, id: ID, input: QuestInput!): Quest!
    deleteQuest(campaignId: ID!, id: ID!): Boolean!

    # Groups
    saveGroup(campaignId: ID!, id: ID, input: GroupInput!): Group!
    deleteGroup(campaignId: ID!, id: ID!): Boolean!

    # Locations
    saveLocation(campaignId: ID!, id: ID, input: LocationInput!): Location!
    deleteLocation(campaignId: ID!, id: ID!): Boolean!

    # Relations
    saveRelation(campaignId: ID!, id: ID, input: RelationInput!): Relation!
    deleteRelation(id: ID!): Boolean!

    # Location Types
    saveLocationType(campaignId: ID!, id: ID, name: String!, icon: String!, category: String!, biomeOptions: [String!], isSettlement: Boolean): LocationType!
    deleteLocationType(id: ID!): Boolean!
    saveContainmentRule(id: ID, parentTypeId: String!, childTypeId: String!): LocationTypeContainmentRule!
    deleteContainmentRule(id: ID!): Boolean!

    # Group Types
    saveGroupType(campaignId: ID!, id: ID, name: String!, icon: String, description: String): GroupType!
    deleteGroupType(id: ID!): Boolean!

    # Species Types
    saveSpeciesType(campaignId: ID!, id: ID, name: String!, icon: String, description: String): SpeciesType!
    deleteSpeciesType(id: ID!): Boolean!

    # Species
    saveSpecies(campaignId: ID!, id: ID, name: String!, pluralName: String, type: String!, size: String!, description: String, traits: [String!], image: String): Species!
    deleteSpecies(id: ID!): Boolean!

    # Characters
    saveCharacter(campaignId: ID!, id: ID, userId: ID, name: String!, gender: Gender, age: Int, species: String, speciesId: String, class: String, appearance: String, background: String, personality: String, motivation: String, bonds: String, flaws: String, gmNotes: String, image: String): PlayerCharacter!
    deleteCharacter(campaignId: ID!, id: ID!): Boolean!

    # Party & Invitations
    invitePlayer(campaignId: ID!, userId: ID!): CampaignInvitation!
    cancelInvitation(id: ID!): Boolean!
    respondToInvitation(id: ID!, accept: Boolean!): CampaignInvitation!
    assignCharacterToPlayer(characterId: ID!, userId: ID): PlayerCharacter!
    removeCampaignMember(campaignId: ID!, userId: ID!): Boolean!

    # Session Notes
    saveSessionNote(sessionId: ID!, content: String!): SessionNote!

    # NPC sub-entities
    addNPCLocationPresence(npcId: ID!, locationId: ID!, note: String): NPC!
    removeNPCLocationPresence(npcId: ID!, locationId: ID!): NPC!
    addNPCGroupMembership(npcId: ID!, groupId: ID!, relation: String, subfaction: String): NPC!
    removeNPCGroupMembership(npcId: ID!, groupId: ID!): NPC!

    # NPC link visibility
    setNPCGroupMembershipVisibility(npcId: ID!, groupId: ID!, playerVisible: Boolean!): NPC!
    setNPCLocationPresenceVisibility(npcId: ID!, locationId: ID!, playerVisible: Boolean!): NPC!

    # Entity Visibility (GM-only)
    setNPCVisibility(campaignId: ID!, id: ID!, input: SetEntityVisibilityInput!): NPC!
    setLocationVisibility(campaignId: ID!, id: ID!, input: SetEntityVisibilityInput!): Location!
    setQuestVisibility(campaignId: ID!, id: ID!, input: SetEntityVisibilityInput!): Quest!
    setGroupVisibility(campaignId: ID!, id: ID!, input: SetEntityVisibilityInput!): Group!

    # Character sub-entities
    addCharacterGroupMembership(characterId: ID!, groupId: ID!, relation: String, subfaction: String): PlayerCharacter!
    removeCharacterGroupMembership(characterId: ID!, groupId: ID!): PlayerCharacter!

    # Admin
    adminCreateUser(input: AdminCreateUserInput!): User!
    adminUpdateUser(id: ID!, input: AdminUpdateUserInput!): User!
    adminDeleteUser(id: ID!): Boolean!
  }

  # ── Subscriptions ──────────────────────────────────────────

  enum ChangeAction {
    CREATED
    UPDATED
    DELETED
  }

  type CampaignEvent {
    entityType: String!
    entityId: ID!
    action: ChangeAction!
    campaignId: ID!
    relatedIds: [ID!]
  }

  type UserEvent {
    type: String!
    entityId: ID!
  }

  type Subscription {
    campaignEvent(campaignId: ID!): CampaignEvent!
    campaignsChanged: CampaignEvent!
    userEvent(userId: ID!): UserEvent!
    usersChanged: Boolean!
  }
`;
