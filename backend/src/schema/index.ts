export const typeDefs = `#graphql

  # ── Enums ───────────────────────────────────────────────────

  enum Role { GM PLAYER }
  enum NPCStatus { ALIVE DEAD MISSING UNKNOWN HOSTILE }
  enum Gender { MALE FEMALE NONBINARY }
  enum QuestStatus { ACTIVE COMPLETED FAILED UNAVAILABLE UNDISCOVERED }

  # ── Auth ────────────────────────────────────────────────────

  type User {
    id: ID!
    email: String!
    name: String!
    avatar: String
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
    createdAt: String!
    archivedAt: String
    myRole: Role!
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
    role: Role!
    joinedAt: String!
  }

  # ── Session ────────────────────────────────────────────────

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
  }

  # ── NPC ────────────────────────────────────────────────────

  type NPCLocationPresence {
    locationId: ID!
    location: Location!
    note: String
  }

  type NPCGroupMembership {
    groupId: ID!
    group: Group!
    relation: String
    subfaction: String
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
    locationPresences: [NPCLocationPresence!]!
    groupMemberships: [NPCGroupMembership!]!
    sessions: [Session!]!
    questsGiven: [Quest!]!
  }

  # ── Player Character ───────────────────────────────────────

  type PlayerCharacter {
    id: ID!
    campaignId: ID!
    userId: ID!
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
  }

  # ── Group ──────────────────────────────────────────────────

  type Group {
    id: ID!
    campaignId: ID!
    name: String!
    type: String!
    aliases: [String!]!
    description: String!
    goals: String
    symbols: String
    gmNotes: String
    partyRelation: String
    createdAt: String!
    updatedAt: String!
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
    aliases: [String!]!
    type: String!
    settlementPopulation: Int
    biome: String
    parentLocationId: String
    parentLocation: Location
    description: String!
    image: String
    gmNotes: String
    mapMarkers: [MapMarker!]!
    createdAt: String!
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
    sessions(campaignId: ID!): [Session!]!
    session(campaignId: ID!, id: ID!): Session

    # NPCs
    npcs(campaignId: ID!): [NPC!]!
    npc(campaignId: ID!, id: ID!): NPC

    # Characters
    party(campaignId: ID!): [PlayerCharacter!]!

    # Quests
    quests(campaignId: ID!): [Quest!]!
    quest(campaignId: ID!, id: ID!): Quest

    # Groups
    groups(campaignId: ID!, search: String, type: String): [Group!]!
    group(campaignId: ID!, id: ID!): Group

    # Locations
    locations(campaignId: ID!): [Location!]!
    location(campaignId: ID!, id: ID!): Location

    # Location Types
    locationTypes(campaignId: ID!): [LocationType!]!
    containmentRules: [LocationTypeContainmentRule!]!

    # Group Types
    groupTypes(campaignId: ID!, search: String): [GroupType!]!

    # Species Types
    speciesTypes(campaignId: ID!, search: String): [SpeciesType!]!

    # Species
    species(campaignId: ID!): [Species!]!

    # Relations
    relationsForEntity(campaignId: ID!, entityId: ID!): [Relation!]!
    relationsForCampaign(campaignId: ID!): [Relation!]!
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
    type: String!
    aliases: [String!]
    description: String
    goals: String
    symbols: String
    gmNotes: String
    partyRelation: String
  }

  input LocationInput {
    name: String!
    aliases: [String!]
    type: String!
    settlementPopulation: Int
    biome: String
    parentLocationId: String
    description: String
    image: String
    gmNotes: String
    mapMarkers: String # JSON string
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

    # Campaigns
    createCampaign(title: String!, description: String): Campaign!
    updateCampaign(id: ID!, title: String, description: String, archivedAt: String): Campaign!

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
    saveCharacter(campaignId: ID!, id: ID, name: String!, gender: Gender, age: Int, species: String, speciesId: String, class: String, appearance: String, background: String, personality: String, motivation: String, bonds: String, flaws: String, gmNotes: String, image: String): PlayerCharacter!

    # NPC sub-entities
    addNPCLocationPresence(npcId: ID!, locationId: ID!, note: String): NPC!
    removeNPCLocationPresence(npcId: ID!, locationId: ID!): NPC!
    addNPCGroupMembership(npcId: ID!, groupId: ID!, relation: String, subfaction: String): NPC!
    removeNPCGroupMembership(npcId: ID!, groupId: ID!): NPC!
  }

  # ── Subscriptions ──────────────────────────────────────────

  type Subscription {
    campaignUpdated(campaignId: ID!): Campaign!
    sessionChanged(campaignId: ID!): Session!
    npcChanged(campaignId: ID!): NPC!
    questChanged(campaignId: ID!): Quest!
  }
`;
