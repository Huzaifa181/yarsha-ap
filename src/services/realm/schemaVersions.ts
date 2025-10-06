/**
 * Current schema version - increment this when you make schema changes
 * 
 * Versioning history:
 * 1: Initial schema
 * 2: Added isIndividualBotChat to ChatsModel
 */
export const SCHEMA_VERSION = 2;

export const getSchemaVersion = (): number => {
  return SCHEMA_VERSION;
};
