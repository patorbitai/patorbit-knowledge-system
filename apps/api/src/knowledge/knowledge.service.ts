// apps/api/src/knowledge/knowledge.service.ts
import { BadRequestException, ConflictException,Injectable, NotFoundException } from '@nestjs/common';
import { type PrismaService } from '@patorbit/database';
import { type Prisma } from '@patorbit/database';

import { type CreateKnowledgeEdgeDto } from './dto/create-knowledge-edge.dto';
import { type CreateKnowledgeNodeDto } from './dto/create-knowledge-node.dto';

@Injectable()
export class KnowledgeService {
  constructor(private prisma: PrismaService) {}

  async createNode(createKnowledgeNodeDto: CreateKnowledgeNodeDto) {
    const { type, name, profileId, metadata } = createKnowledgeNodeDto;

    if (profileId) {
      const profile = await this.prisma.profile.findUnique({
        where: { id: profileId },
      });
      if (!profile) {
        throw new NotFoundException(`Profile with ID "${profileId}" not found`);
      }
    }

    return this.prisma.knowledgeNode.create({
      data: {
        type,
        name,
        profileId: profileId || null,
        metadata: (metadata || {}) as Prisma.InputJsonValue,
      },
    });
  }

  async findNode(id: string) {
    const node = await this.prisma.knowledgeNode.findUnique({
      where: { id },
    });
    if (!node) {
      throw new NotFoundException(`Knowledge node with ID "${id}" not found`);
    }
    return node;
  }

  async searchNodes(type?: string, name?: string) {
    const where: any = {};

    if (type) {
      where.type = type;
    }
    if (name) {
      where.name = { contains: name, mode: 'insensitive' };
    }

    return this.prisma.knowledgeNode.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async createEdge(createKnowledgeEdgeDto: CreateKnowledgeEdgeDto) {
    const { fromNodeId, toNodeId } = createKnowledgeEdgeDto;

    if (fromNodeId === toNodeId) {
      throw new BadRequestException('Cannot create an edge from a node to itself');
    }

    const fromNode = await this.prisma.knowledgeNode.findUnique({
      where: { id: fromNodeId },
    });
    if (!fromNode) {
      throw new NotFoundException(`From-node with ID "${fromNodeId}" not found`);
    }

    const toNode = await this.prisma.knowledgeNode.findUnique({
      where: { id: toNodeId },
    });
    if (!toNode) {
      throw new NotFoundException(`To-node with ID "${toNodeId}" not found`);
    }

    return this.prisma.knowledgeEdge.create({
      data: createKnowledgeEdgeDto,
    });
  }

  async findEdges(nodeId: string) {
    const node = await this.prisma.knowledgeNode.findUnique({
      where: { id: nodeId },
    });
    if (!node) {
      throw new NotFoundException(`Knowledge node with ID "${nodeId}" not found`);
    }

    return this.prisma.knowledgeEdge.findMany({
      where: {
        OR: [{ fromNodeId: nodeId }, { toNodeId: nodeId }],
      },
      include: {
        fromNode: true,
        toNode: true,
      },
    });
  }

  async getGraph(profileId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
    });
    if (!profile) {
      throw new NotFoundException(`Profile with ID "${profileId}" not found`);
    }

    const nodes = await this.prisma.knowledgeNode.findMany({
      where: { profileId },
      include: {
        fromEdges: {
          include: {
            fromNode: true,
            toNode: true,
          },
        },
        toEdges: {
          include: {
            fromNode: true,
            toNode: true,
          },
        },
      },
    });

    const edgeMap = new Map<string, any>();
    for (const node of nodes) {
      for (const edge of node.fromEdges) {
        edgeMap.set(edge.id, edge);
      }
      for (const edge of node.toEdges) {
        edgeMap.set(edge.id, edge);
      }
    }

    return {
      nodes,
      edges: Array.from(edgeMap.values()),
    };
  }

  async deleteNode(id: string) {
    await this.findNode(id);
    return this.prisma.knowledgeNode.delete({
      where: { id },
    });
  }

  async deleteEdge(id: string) {
    const edge = await this.prisma.knowledgeEdge.findUnique({
      where: { id },
    });
    if (!edge) {
      throw new NotFoundException(`Knowledge edge with ID "${id}" not found`);
    }
    return this.prisma.knowledgeEdge.delete({
      where: { id },
    });
  }
}
