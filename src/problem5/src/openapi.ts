import { OpenAPIV3 } from 'openapi-types';

export const openApiDocument: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'Resource Registry API',
    version: '1.0.0',
    description:
      'CRUD API for managing resource records in the 99Tech code challenge. All responses use a `{ "data": ... }` envelope unless noted otherwise.',
    contact: {
      name: '99Tech Challenge',
      url: 'https://github.com/99tech',
    },
  },
  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Local development',
    },
  ],
  tags: [
    {
      name: 'Observability',
      description: 'Service readiness probes',
    },
    {
      name: 'Resources',
      description: 'CRUD operations for resource entries',
    },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Observability'],
        summary: 'Health probe',
        description: 'Returns a heartbeat payload that can be used for readiness checks.',
        responses: {
          '200': {
            description: 'Service is reachable',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/resources': {
      get: {
        tags: ['Resources'],
        summary: 'List resources',
        description: 'Retrieve resources that match optional search filters. Results are not paginated.',
        parameters: [
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string' },
            description: 'Case-insensitive substring match against the name and description fields.',
          },
          {
            name: 'tag',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter to resources containing the tag (stored as lowercase).',
          },
          {
            name: 'updatedAfter',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
            description: 'Return resources whose `updatedAt` timestamp is greater than or equal to this ISO date.',
          },
        ],
        responses: {
          '200': {
            description: 'Resources matching the provided filters',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ResourceListResponse',
                },
              },
            },
          },
          '400': {
            description: 'Invalid filter input',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Resources'],
        summary: 'Create a resource',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ResourceCreateInput',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Resource created successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ResourceSingleResponse',
                },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/resources/{id}': {
      get: {
        tags: ['Resources'],
        summary: 'Fetch a resource',
        parameters: [
          {
            $ref: '#/components/parameters/ResourceId',
          },
        ],
        responses: {
          '200': {
            description: 'Resource found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ResourceSingleResponse',
                },
              },
            },
          },
          '404': {
            description: 'Resource not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      put: {
        tags: ['Resources'],
        summary: 'Update a resource',
        parameters: [
          {
            $ref: '#/components/parameters/ResourceId',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ResourceUpdateInput',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Resource updated',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ResourceSingleResponse',
                },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '404': {
            description: 'Resource not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Resources'],
        summary: 'Delete a resource',
        parameters: [
          {
            $ref: '#/components/parameters/ResourceId',
          },
        ],
        responses: {
          '204': {
            description: 'Resource deleted successfully',
          },
          '404': {
            description: 'Resource not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
  },
  components: {
    parameters: {
      ResourceId: {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Unique identifier of the resource.',
        schema: {
          type: 'string',
          format: 'uuid',
        },
      },
    },
    schemas: {
      Resource: {
        type: 'object',
        required: ['id', 'name', 'description', 'tags', 'createdAt', 'updatedAt', 'version'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Server-generated unique identifier.',
          },
          name: {
            type: 'string',
            description: 'Human-readable resource name.',
            example: 'Component library',
          },
          description: {
            type: 'string',
            description: 'Optional description provided by the client.',
            example: 'UI kit for the dashboard',
          },
          tags: {
            type: 'array',
            description: 'List of lowercase tags attached to the resource.',
            items: {
              type: 'string',
              example: 'design',
            },
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp of creation in ISO 8601 format.',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp in ISO 8601 format.',
          },
          version: {
            type: 'integer',
            minimum: 1,
            description: 'Monotonic version counter incremented on updates.',
          },
        },
        additionalProperties: false,
      },
      ResourceListResponse: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/Resource' },
          },
        },
        additionalProperties: false,
      },
      ResourceSingleResponse: {
        type: 'object',
        required: ['data'],
        properties: {
          data: { $ref: '#/components/schemas/Resource' },
        },
        additionalProperties: false,
      },
      ResourceCreateInput: {
        type: 'object',
        required: ['name'],
        properties: {
          name: {
            type: 'string',
            description: 'Required non-empty name for the resource.',
          },
          description: {
            type: 'string',
            description: 'Optional free-form description.',
          },
          tags: {
            type: 'array',
            description: 'Optional list of unique lowercase tags.',
            items: { type: 'string' },
            uniqueItems: true,
          },
        },
        additionalProperties: false,
      },
      ResourceUpdateInput: {
        type: 'object',
        description: 'At least one field must be supplied when updating a resource.',
        properties: {
          name: {
            type: 'string',
            description: 'New name for the resource.',
          },
          description: {
            type: 'string',
            description: 'New description for the resource.',
          },
          tags: {
            type: 'array',
            description: 'Replacement set of lowercase tags.',
            items: { type: 'string' },
            uniqueItems: true,
          },
        },
        minProperties: 1,
        additionalProperties: false,
      },
      ErrorResponse: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'string',
            description: 'Human-readable error message.',
          },
        },
        additionalProperties: false,
      },
      HealthResponse: {
        type: 'object',
        required: ['status', 'timestamp'],
        properties: {
          status: {
            type: 'string',
            example: 'ok',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
        },
        additionalProperties: false,
      },
    },
  },
};
