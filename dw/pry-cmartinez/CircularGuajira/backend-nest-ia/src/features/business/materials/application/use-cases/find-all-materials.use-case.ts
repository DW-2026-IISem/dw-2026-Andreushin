import { Inject, Injectable } from '@nestjs/common';
import type { MaterialEntity } from '../../domain/entities/material.entity.js';
import {
  MATERIAL_REPOSITORY,
  type IMaterialRepository,
} from '../../domain/interfaces/material.repository.interface.js';
import type { FindAllMaterialsQueryDto } from '../dto/find-all-materials-query.dto.js';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedMaterials {
  items: MaterialEntity[];
  meta: PaginationMeta;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

@Injectable()
export class FindAllMaterialsUseCase {
  constructor(
    @Inject(MATERIAL_REPOSITORY)
    private readonly materialRepository: IMaterialRepository,
  ) {}

  async execute(query: FindAllMaterialsQueryDto): Promise<PaginatedMaterials> {
    const page = query.page ?? DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_LIMIT;

    const { items, total } = await this.materialRepository.findAll({
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
