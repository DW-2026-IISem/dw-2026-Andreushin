import { Inject, Injectable } from '@nestjs/common';
import type { RecyclerEntity } from '../../domain/entities/recycler.entity.js';
import {
  RECYCLER_REPOSITORY,
  type IRecyclerRepository,
} from '../../domain/interfaces/recycler.repository.interface.js';
import type { FindAllRecyclersQueryDto } from '../dto/find-all-recyclers-query.dto.js';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedRecyclers {
  items: RecyclerEntity[];
  meta: PaginationMeta;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

@Injectable()
export class FindAllRecyclersUseCase {
  constructor(
    @Inject(RECYCLER_REPOSITORY)
    private readonly recyclerRepository: IRecyclerRepository,
  ) {}

  async execute(query: FindAllRecyclersQueryDto): Promise<PaginatedRecyclers> {
    const page = query.page ?? DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_LIMIT;

    const { items, total } = await this.recyclerRepository.findAll({
      page,
      limit,
    });

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }
}
