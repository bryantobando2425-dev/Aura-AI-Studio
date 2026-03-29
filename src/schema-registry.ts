export const COLLECTIONS = {
  USERS: 'users',
  CRONICAS: 'cronicas',
  PERSONAJES: 'personajes',
  MUNDOS: 'mundos',
  BESTIARIO: 'bestiario',
  FACCIONES: 'facciones',
  OBJETOS: 'objetos',
} as const;

export interface BaseEntity {
  id: string;
  userId: string;
  worldId?: string | null; // Si es null o undefined, la entidad es "Libre"
  createdAt: any;
  status?: string; // Estado global de la entidad
  // Estados por Instancia: Permite que una entidad tenga estados distintos según el worldId o cronicaId
  instanceStates?: Record<string, { status: string; [key: string]: any }>; 
  isFavorite?: boolean;
  history?: { timestamp: number; changes: string }[];
}

export interface Personaje extends BaseEntity {
  name: string;
  race?: string;
  class?: string;
  bio?: string;
  imageUrl?: string;
}

export interface Bestiario extends BaseEntity {
  name: string;
  description: string;
  dangerLevel?: string;
}

export interface Faccion extends BaseEntity {
  name: string;
  description: string;
  influence?: string;
}

export interface Objeto extends BaseEntity {
  name: string;
  description: string;
  type?: string;
}

export interface Cronica extends BaseEntity {
  characterId: string;
  title: string;
  genre: string;
  summary: string;
  status: 'active' | 'completed';
}

export interface TreeNode {
  id: string;
  name: string;
  type: 'region' | 'ciudad' | 'localizacion' | 'sub-localizacion' | 'edificio' | 'habitacion';
  children: TreeNode[];
  content?: string; // Markdown content for this node
}

export interface Mundo extends BaseEntity {
  name: string;
  description: string;
  imageUrl?: string;
  
  // Nexo (ADN del Mundo)
  magicActive?: boolean;
  techActive?: boolean;
  biologicalMortality?: boolean;
  startYear?: number;

  // Núcleo y Leyes
  magicLevel?: number; // 0-100
  techLevel?: number; // 0-100
  gravity?: number; // 0.1-5.0
  forbiddenLaws?: string; // Markdown

  // Geografía y Ecología
  climate?: string;
  biomes?: string[];
  naturalResources?: string[];
  bestiaryIds?: string[]; // Vínculo a bestiario

  // Sociedad y Economía
  governmentType?: string;
  currency?: string;
  officialLanguages?: string[];
  socialTaboos?: string[];

  // Cronología
  eras?: { id: string; name: string; startYear: number; endYear: number; description: string }[];
  historicalEvents?: { id: string; eraId: string; year: number; name: string; description: string }[];

  // Árbol Jerárquico
  treeNodes?: TreeNode[];

  // Facciones Dominantes
  dominantFactions?: string[]; // IDs de Facciones
}

export interface Message {
  id: string;
  cronicaId: string;
  role: 'user' | 'model' | 'system';
  content: string;
  type: 'text' | 'image' | 'video';
  imageUrl?: string;
  videoUrl?: string;
  createdAt: any;
}

export function checkSecuritySync() {
  console.log("[Schema Registry] Verificando sincronización de permisos...");
  const requiredCollections = Object.values(COLLECTIONS);
  console.log(`[Schema Registry] Colecciones registradas: ${requiredCollections.join(', ')}`);
  console.log("[Schema Registry] Asegúrese de que firestore.rules permita acceso a auth.uid para todas estas colecciones.");
}
