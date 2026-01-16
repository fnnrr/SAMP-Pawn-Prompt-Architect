
export enum ScriptType {
  GAMEMODE = 'Gamemode',
  FILTERSCRIPT = 'Filterscript',
  INCLUDE = 'Include',
  PLUGIN_MODULE = 'Plugin Module'
}

export enum SampVersion {
  SAMP_037 = 'SAMP 0.3.7 (Legacy)',
  OPEN_MP = 'open.mp (Modern)'
}

export enum DatabaseType {
  NONE = 'None (Flat files)',
  MYSQL = 'MySQL (blueG/R41+)',
  SQLITE = 'SQLite (Internal)'
}

export enum CommandProcessor {
  STANDARD = 'Standard (strcmp)',
  ZCMD = 'ZCMD',
  PAWN_CMD = 'Pawn.CMD',
  IZCMD = 'izcmd'
}

export interface PromptConfig {
  type: ScriptType;
  version: SampVersion;
  database: DatabaseType;
  commandProcessor: CommandProcessor;
  features: string;
  useYSI: boolean;
  useStreamer: boolean;
  authorName: string;
}

export interface User {
  username: string;
  email: string;
  isPremium: boolean;
  premiumCode?: string;
  generationsToday: number;
  lastGenerationDate: string; // ISO string
  cloudSynced: boolean;
  syncEndpoint?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'system';
  text: string;
  timestamp: string;
}

export interface PremiumKey {
  id: string;
  key: string;
  status: 'active' | 'redeemed';
  created_at: string;
  redeemed_by?: string;
  redeemed_at?: string;
}

export interface Purchase {
  id: string;
  purchase_id: string;
  buyer_email: string;
  amount: number;
  gcash_ref: string;
  status: 'pending' | 'approved' | 'rejected';
  key?: string;
  rejection_reason?: string;
  created_at: string;
  validated_at?: string;
}

