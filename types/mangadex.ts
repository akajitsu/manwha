/**
 * Raw MangaDex API v5 response shapes (only the fields this app reads).
 * Reference: https://api.mangadex.org/docs/
 */

export type LocalizedString = Record<string, string>;

export type ContentRating = "safe" | "suggestive" | "erotica" | "pornographic";
export type PublicationStatus = "ongoing" | "completed" | "hiatus" | "cancelled";
export type Demographic = "shounen" | "shoujo" | "josei" | "seinen";

export interface MdRelationship<TType extends string = string, TAttr = unknown> {
  id: string;
  type: TType;
  related?: string;
  attributes?: TAttr;
}

export interface MdTagAttributes {
  name: LocalizedString;
  group: "genre" | "theme" | "format" | "content";
}

export interface MdTag {
  id: string;
  type: "tag";
  attributes: MdTagAttributes;
}

export interface MdCoverAttributes {
  fileName: string;
  volume: string | null;
  locale: string | null;
}

export interface MdAuthorAttributes {
  name: string;
}

export interface MdGroupAttributes {
  name: string;
  website: string | null;
  official?: boolean;
}

export interface MdMangaAttributes {
  title: LocalizedString;
  altTitles: LocalizedString[];
  description: LocalizedString;
  links: Record<string, string> | null;
  originalLanguage: string;
  lastVolume: string | null;
  lastChapter: string | null;
  publicationDemographic: Demographic | null;
  status: PublicationStatus;
  year: number | null;
  contentRating: ContentRating;
  tags: MdTag[];
  createdAt: string;
  updatedAt: string;
  availableTranslatedLanguages: (string | null)[];
  latestUploadedChapter: string | null;
}

export type MdMangaRelationship =
  | MdRelationship<"cover_art", MdCoverAttributes>
  | MdRelationship<"author", MdAuthorAttributes>
  | MdRelationship<"artist", MdAuthorAttributes>
  | MdRelationship<string, unknown>;

export interface MdManga {
  id: string;
  type: "manga";
  attributes: MdMangaAttributes;
  relationships: MdMangaRelationship[];
}

export interface MdChapterAttributes {
  volume: string | null;
  chapter: string | null;
  title: string | null;
  translatedLanguage: string;
  externalUrl: string | null;
  isUnavailable?: boolean;
  publishAt: string;
  readableAt: string;
  createdAt: string;
  updatedAt: string;
  pages: number;
}

export interface MdChapter {
  id: string;
  type: "chapter";
  attributes: MdChapterAttributes;
  relationships: (
    | MdRelationship<"scanlation_group", MdGroupAttributes>
    | MdRelationship<"manga", MdMangaAttributes>
    | MdRelationship<"user", unknown>
    | MdRelationship<string, unknown>
  )[];
}

export interface MdCollection<T> {
  result: "ok";
  response: "collection";
  data: T[];
  limit: number;
  offset: number;
  total: number;
}

export interface MdEntity<T> {
  result: "ok";
  response: "entity";
  data: T;
}

export interface MdAtHomeResponse {
  result: "ok";
  baseUrl: string;
  chapter: {
    hash: string;
    data: string[];
    dataSaver: string[];
  };
}

export interface MdStatisticsResponse {
  result: "ok";
  statistics: Record<
    string,
    {
      follows: number | null;
      rating: { average: number | null; bayesian: number | null } | null;
    }
  >;
}

export interface MdErrorResponse {
  result: "error";
  errors: { status: number; title: string; detail: string | null }[];
}
