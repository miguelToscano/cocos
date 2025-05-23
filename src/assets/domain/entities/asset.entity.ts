import { AssetType } from "../enums/asset-type.enum";

export class Asset {
  id: number;
  ticker: string;
  name: string;
  type: AssetType;
}
