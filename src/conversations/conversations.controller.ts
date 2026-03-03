import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { MessagesService } from './messages.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ConversationsQueryDto } from './dto/conversations-query.dto';
import { MessagesQueryDto } from './dto/messages-query.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { SetReactionDto } from './dto/set-reaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('Conversations')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConversationsController {
  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly messagesService: MessagesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create or get conversation with teammate' })
  @ApiResponse({ status: 201, description: 'Conversation created or found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Can only message teammates' })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateConversationDto,
  ) {
    return this.conversationsService.findOrCreate(user.id, dto.teammate_id);
  }

  @Get()
  @ApiOperation({ summary: 'List my conversations (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated list of conversations' })
  async getConversations(
    @CurrentUser() user: User,
    @Query() query: ConversationsQueryDto,
  ) {
    return this.conversationsService.findByUser(
      user.id,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages in conversation (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated list of messages' })
  @ApiResponse({ status: 403, description: 'Not a participant' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getMessages(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: MessagesQueryDto,
  ) {
    return this.messagesService.findByConversation(
      user.id,
      id,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @Put(':id/messages/:messageId/reaction')
  @ApiOperation({
    summary: 'Set or replace reaction on a message',
    description:
      'One reaction per message max. Set reaction_type to add or replace.',
  })
  @ApiResponse({ status: 200, description: 'Reaction set' })
  @ApiResponse({ status: 403, description: 'Not a participant' })
  @ApiResponse({ status: 404, description: 'Conversation or message not found' })
  async setReaction(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @Body() dto: SetReactionDto,
  ) {
    return this.messagesService.setReaction(user.id, id, messageId, dto.reaction_type);
  }

  @Delete(':id/messages/:messageId/reaction')
  @ApiOperation({ summary: 'Remove reaction from a message' })
  @ApiResponse({ status: 200, description: 'Reaction removed' })
  @ApiResponse({ status: 403, description: 'Not a participant' })
  @ApiResponse({ status: 404, description: 'Conversation or message not found' })
  async removeReaction(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('messageId', ParseUUIDPipe) messageId: string,
  ) {
    return this.messagesService.setReaction(user.id, id, messageId, null);
  }

  @Patch(':id/messages/read')
  @ApiOperation({ summary: 'Mark messages as read' })
  @ApiResponse({ status: 200, description: 'Messages marked as read' })
  @ApiResponse({ status: 403, description: 'Not a participant' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async markAsRead(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MarkReadDto,
  ) {
    return this.messagesService.markAsRead(
      user.id,
      id,
      dto.message_ids,
    );
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  @ApiResponse({ status: 400, description: 'Invalid message (e.g. text required for text type)' })
  @ApiResponse({ status: 403, description: 'Not a participant' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async sendMessage(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagesService.send(user.id, id, dto);
  }
}
