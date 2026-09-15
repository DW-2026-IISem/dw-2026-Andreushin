import { Inject, Injectable } from '@nestjs/common';
import type { MaterialRateEntity } from '../../domain/entities/material-rate.entity.js';
import {
  MATERIAL_RATE_REPOSITORY,
  type IMaterialRateRepository,
} from '../../domain/interfaces/material-rate.repository.interface.js';
import type { FindAllMaterialRatesQueryDto } from '../dto/find-all-material-rates-query.dto.js';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedMaterialRates {
  items: MaterialRateEntity[];
  meta: PaginationMeta;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

@Injectable()
export class FindAllMaterialRatesUseCase {
  constructor(
    @Inject(MATERIAL_RATE_REPOSITORY)
    private readonly materialRateRepository: IMaterialRateRepository,
  ) {}

  async execute(query: FindAllMaterialRatesQueryDto): Promise<PaginatedMaterialRates> {
    const page = query.page ?? DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_LIMIT;

    const { items, total } = await this.materialRateRepository.findAll({
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
