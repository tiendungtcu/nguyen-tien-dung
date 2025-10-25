export interface Resource {
  id: string;
  name: string;
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface ResourceCreateInput {
  name: string;
  description?: string;
  tags?: string[];
}

export interface ResourceUpdateInput {
  name?: string;
  description?: string;
  tags?: string[];
}

export interface ResourceFilters {
  search?: string;
  tag?: string;
  updatedAfter?: string;
}
