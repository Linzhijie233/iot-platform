import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { okItem, okList, pickFilter } from '../../common/api-response';
import { type PlatformUser, UserService } from './user.service';

@ApiTags('用户管理')
@Controller('/v1/users')
export class UserController {
  constructor(private readonly users: UserService) {}

  @Get()
  @ApiOperation({ summary: '用户分页列表（keyword/role/status 筛选）' })
  async list(@Query() q: Record<string, string>) {
    const { data, total } = await this.users.list<PlatformUser>({
      page: Number(q.page) || 1,
      pageSize: Number(q.pageSize) || 500,
      keyword: q.keyword,
      filter: pickFilter(q, ['role', 'status']),
    });
    return okList(data, total);
  }

  @Post()
  @ApiOperation({ summary: '新增用户' })
  async create(@Body() body: Partial<PlatformUser>) {
    return okItem(await this.users.create<PlatformUser>(body));
  }

  @Patch(':id')
  @ApiOperation({ summary: '编辑用户（含启用/停用）' })
  async update(@Param('id') id: string, @Body() body: Partial<PlatformUser>) {
    const updated = await this.users.update<PlatformUser>(id, body);
    if (!updated) throw new NotFoundException('用户不存在');
    return okItem(updated);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户' })
  async remove(@Param('id') id: string) {
    const ok = await this.users.remove(id);
    if (!ok) throw new NotFoundException('用户不存在');
    return okItem({ id, removed: true });
  }
}
