import { HttpError } from './errors';
import { ResourceCreateInput, ResourceFilters, ResourceUpdateInput } from './types';

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

const normaliseTags = (value: unknown): string[] | undefined => {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    throw new HttpError(400, 'tags must be an array of strings');
  }
  const tags = value.map((item) => {
    if (!isNonEmptyString(item)) {
      throw new HttpError(400, 'tags must be an array of non-empty strings');
    }
    return item.trim().toLowerCase();
  });
  return Array.from(new Set(tags));
};

export const parseCreatePayload = (payload: unknown): ResourceCreateInput => {
  if (typeof payload !== 'object' || payload === null) {
    throw new HttpError(400, 'Request body must be a JSON object');
  }
  const { name, description, tags } = payload as Record<string, unknown>;

  if (!isNonEmptyString(name)) {
    throw new HttpError(400, 'name is required');
  }

  if (description !== undefined && typeof description !== 'string') {
    throw new HttpError(400, 'description must be a string');
  }

  return {
    name: name.trim(),
    description: description?.toString(),
    tags: normaliseTags(tags),
  };
};

export const parseUpdatePayload = (payload: unknown): ResourceUpdateInput => {
  if (typeof payload !== 'object' || payload === null) {
    throw new HttpError(400, 'Request body must be a JSON object');
  }
  const { name, description, tags } = payload as Record<string, unknown>;

  if (name !== undefined && !isNonEmptyString(name)) {
    throw new HttpError(400, 'name must be a non-empty string when provided');
  }

  if (description !== undefined && typeof description !== 'string') {
    throw new HttpError(400, 'description must be a string when provided');
  }

  const normalised: ResourceUpdateInput = {};
  if (name) normalised.name = name.trim();
  if (description !== undefined) normalised.description = description;
  const parsedTags = normaliseTags(tags);
  if (parsedTags !== undefined) normalised.tags = parsedTags;

  if (Object.keys(normalised).length === 0) {
    throw new HttpError(400, 'Provide at least one field to update');
  }

  return normalised;
};

export const parseFilters = (query: Record<string, unknown>): ResourceFilters => {
  const filters: ResourceFilters = {};
  if (query.search && typeof query.search === 'string') {
    filters.search = query.search.trim();
  }
  if (query.tag && typeof query.tag === 'string') {
    filters.tag = query.tag.trim().toLowerCase();
  }
  if (query.updatedAfter && typeof query.updatedAfter === 'string') {
    const parsed = new Date(query.updatedAfter);
    if (Number.isNaN(parsed.getTime())) {
      throw new HttpError(400, 'updatedAfter must be a valid ISO date string');
    }
    filters.updatedAfter = parsed.toISOString();
  }
  return filters;
};
