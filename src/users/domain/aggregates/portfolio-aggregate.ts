import { PickType } from "@nestjs/mapped-types";
import { Asset } from "src/assets/domain/entities/asset.entity";
import { User } from "../entities/user.entity";

export class Portfolio extends PickType(User, [
  "id",
  "email",
  "accountNumber",
]) {
  balance: number;
  assets: PortfolioAsset;
}

export class PortfolioAsset extends PickType(Asset, ["id", "ticker", "name"]) {
  quantity: number;
}
