// apps/api/src/knowledge/knowledge.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { CreateKnowledgeNodeDto } from './dto/create-knowledge-node.dto';
import { CreateKnowledgeEdgeDto } from './dto/create-knowledge-edge.dto';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('knowledge')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Post('nodes')
  createNode(@Body() createKnowledgeNodeDto: CreateKnowledgeNodeDto) {
    return this.knowledgeService.createNode(createKnowledgeNodeDto);
  }

  @Get('nodes/search')
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'name', required: false })
  searchNodes(
    @Query('type') type?: string,
    @Query('name') name?: string,
  ) {
    return this.knowledgeService.searchNodes(type, name);
  }

  @Get('nodes/:id')
  findNode(@Param('id') id: string) {
    return this.knowledgeService.findNode(id);
  }

  @Post('edges')
  createEdge(@Body() createKnowledgeEdgeDto: CreateKnowledgeEdgeDto) {
    return this.knowledgeService.createEdge(createKnowledgeEdgeDto);
  }

  @Get('graph/profile/:profileId')
  getGraph(@Param('profileId') profileId: string) {
    return this.knowledgeService.getGraph(profileId);
  }

  @Get('edges/node/:nodeId')
  findEdges(@Param('nodeId') nodeId: string) {
    return this.knowledgeService.findEdges(nodeId);
  }

  @Delete('nodes/:id')
  deleteNode(@Param('id') id: string) {
    return this.knowledgeService.deleteNode(id);
  }

  @Delete('edges/:id')
  deleteEdge(@Param('id') id: string) {
    return this.knowledgeService.deleteEdge(id);
  }
}
