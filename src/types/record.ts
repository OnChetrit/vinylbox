export type RecordItem = {
  id: string;
  /** Discogs collection instance IDs are required when removing a specific copy. */
  instanceId?: string;
  folderId?: number;
  /** The Discogs master release that groups alternate pressings of this album. */
  masterId?: string;
  /** Original album release year, resolved from the Discogs master release. */
  originalYear?: string;
  title: string;
  artist: string;
  year?: string;
  coverUrl?: string;
  genre?: string;
  style?: string;
  country?: string;
  labels?: string[];
  formats?: string[];
  notes?: string;
  description?: string;
  tracklist?: string[];
};
