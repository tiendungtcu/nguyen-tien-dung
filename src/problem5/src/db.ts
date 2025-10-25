import { promises as fs } from 'fs';
import { dirname } from 'path';
import { randomUUID } from 'crypto';
import { Resource, ResourceCreateInput, ResourceUpdateInput, ResourceFilters } from './types';

export class ResourceStore {
  private readonly filePath: string;
  private resources: Resource[] = [];
  private initialized = false;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    try {
      const raw = await fs.readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(raw) as { resources?: Resource[] };
      this.resources = Array.isArray(parsed.resources) ? parsed.resources : [];
    } catch (error) {
      if ((error as { code?: string }).code === 'ENOENT') {
        await fs.mkdir(dirname(this.filePath), { recursive: true });
        await this.persist();
      } else {
        throw error;
      }
    }
    this.initialized = true;
  }

  async list(filters: ResourceFilters = {}): Promise<Resource[]> {
    await this.init();
    const { search, tag, updatedAfter } = filters;
    const updatedAfterDate = updatedAfter ? new Date(updatedAfter) : undefined;

    return this.resources.filter((resource) => {
      const matchesSearch = search
        ? resource.name.toLowerCase().includes(search.toLowerCase()) ||
          resource.description.toLowerCase().includes(search.toLowerCase())
        : true;
      const matchesTag = tag ? resource.tags.includes(tag) : true;
      const matchesUpdatedAfter = updatedAfterDate
        ? new Date(resource.updatedAt).getTime() >= updatedAfterDate.getTime()
        : true;
      return matchesSearch && matchesTag && matchesUpdatedAfter;
    });
  }

  async findById(id: string): Promise<Resource | undefined> {
    await this.init();
    return this.resources.find((resource) => resource.id === id);
  }

  async insert(payload: ResourceCreateInput): Promise<Resource> {
    await this.init();
    const now = new Date().toISOString();
    const resource: Resource = {
      id: randomUUID(),
      name: payload.name,
      description: payload.description?.trim() ?? '',
      tags: payload.tags ?? [],
      createdAt: now,
      updatedAt: now,
      version: 1,
    };
    this.resources.push(resource);
    await this.persist();
    return resource;
  }

  async update(id: string, payload: ResourceUpdateInput): Promise<Resource | undefined> {
    await this.init();
    const index = this.resources.findIndex((resource) => resource.id === id);
    if (index === -1) return undefined;
    const current = this.resources[index];
    const now = new Date().toISOString();
    const updated: Resource = {
      ...current,
      name: payload.name ?? current.name,
      description: payload.description?.trim() ?? current.description,
      tags: payload.tags ?? current.tags,
      updatedAt: now,
      version: current.version + 1,
    };
    this.resources[index] = updated;
    await this.persist();
    return updated;
  }

  async remove(id: string): Promise<boolean> {
    await this.init();
    const originalLength = this.resources.length;
    this.resources = this.resources.filter((resource) => resource.id !== id);
    if (this.resources.length === originalLength) {
      return false;
    }
    await this.persist();
    return true;
  }

  private async persist(): Promise<void> {
    const payload = JSON.stringify({ resources: this.resources }, null, 2);
    await fs.writeFile(this.filePath, payload, 'utf-8');
  }
}
