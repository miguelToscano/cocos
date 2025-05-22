import { Injectable } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersRepository } from "./users.repository";
import { GetUsersDto } from "./dto/get-users.dto";
import { GetUserDetailDto } from "./dto/get-user-detail.dto";

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  create(createUserDto: CreateUserDto) {
    return "This action adds a new user";
  }

  findAll() {
    return `This action returns all users`;
  }

  async getUsers(): Promise<GetUsersDto> {
    return {
      users: [],
    };
  }

  async getUserDetail(id: number): Promise<GetUserDetailDto> {
    return {
      user: {
        id: 1,
        publicId: "fijowkedls",
        email: "test@gmail.com",
        accounts: [],
      },
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
