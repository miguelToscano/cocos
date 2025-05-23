import { Account } from "../entities/account.entity";
import { User } from "../entities/user.entity";

export class UserDetail extends User {
  accounts: Account[];
}
