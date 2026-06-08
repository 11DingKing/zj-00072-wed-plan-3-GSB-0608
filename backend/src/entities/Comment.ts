import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from "typeorm";
import { Checklist } from "./Checklist";
import { User } from "./User";

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text" })
  content!: string;

  @Column({ type: "simple-json", nullable: true })
  mentions?: number[];

  @Column({ nullable: true })
  attachmentUrl?: string;

  @ManyToOne(() => User)
  author!: User;

  @ManyToOne(() => Checklist, (checklist) => checklist.comments)
  checklist!: Checklist;

  @CreateDateColumn()
  createdAt!: Date;
}
