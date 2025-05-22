import { Asset } from "../entities/asset.entity";

export class GetAssetsResponseDto {
  assets: Asset[];
  count: number;
}
