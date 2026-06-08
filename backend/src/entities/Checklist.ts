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
import { User } from "./User";
import { VendorBooking } from "./VendorBooking";
import { Comment } from "./Comment";
import { FileAttachment } from "./FileAttachment";

export type ChecklistStatus = "待开始" | "进行中" | "已完成" | "已跳过";
export type ChecklistPriority = "高" | "中" | "低";
export type ChecklistPhase =
  | "婚前12个月"
  | "婚前6个月"
  | "婚前3个月"
  | "婚前1个月"
  | "婚前1周"
  | "婚礼当天";

@Entity()
export class Checklist {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "date", nullable: true })
  dueDate?: string;

  @Column({
    type: "simple-enum",
    enum: ["待开始", "进行中", "已完成", "已跳过"],
    default: "待开始",
  })
  status!: ChecklistStatus;

  @Column({
    type: "simple-enum",
    enum: ["高", "中", "低"],
    default: "中",
  })
  priority!: ChecklistPriority;

  @Column({
    type: "simple-enum",
    enum: ["婚前12个月", "婚前6个月", "婚前3个月", "婚前1个月", "婚前1周", "婚礼当天"],
  })
  phase!: ChecklistPhase;

  @ManyToOne(() => User, (user) => user.assignedTasks, { nullable: true })
  assignee?: User;

  @ManyToOne(() => Wedding, (wedding) => wedding.checklists)
  wedding!: Wedding;

  @ManyToOne(() => VendorBooking, (vendor) => vendor.checklists, { nullable: true })
  vendor?: VendorBooking;

  @OneToMany(() => Comment, (comment) => comment.checklist)
  comments!: Comment[];

  @OneToMany(() => FileAttachment, (file) => file.checklist)
  files!: FileAttachment[];

  @Column({ default: false })
  isUrgent!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
