import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { Wedding } from "./Wedding";
import { Checklist } from "./Checklist";

export type UserRole = "Admin" | "Couple" | "Assistant";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  username!: string;

  @Column()
  password!: string;

  @Column()
  name!: string;

  @Column({
    type: "simple-enum",
    enum: ["Admin", "Couple", "Assistant"],
    default: "Couple",
  })
  role!: UserRole;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  email?: string;

  @ManyToOne(() => Wedding, (wedding) => wedding.users, { nullable: true })
  wedding?: Wedding;

  @OneToMany(() => Checklist, (checklist) => checklist.assignee)
  assignedTasks!: Checklist[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
