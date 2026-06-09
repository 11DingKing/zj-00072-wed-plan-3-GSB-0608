import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from "typeorm";
import { Wedding } from "./Wedding";
import { User } from "./User";

export type ScheduleEventType =
  | "迎宾"
  | "仪式"
  | "宴会"
  | "敬酒"
  | "送客"
  | "彩排"
  | "化妆"
  | "拍摄"
  | "其他";

@Entity()
export class ScheduleEvent {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column()
  location!: string;

  @Column({ type: "datetime" })
  startTime!: Date;

  @Column({ type: "datetime" })
  endTime!: Date;

  @Column({
    type: "simple-enum",
    enum: [
      "迎宾",
      "仪式",
      "宴会",
      "敬酒",
      "送客",
      "彩排",
      "化妆",
      "拍摄",
      "其他",
    ],
    default: "其他",
  })
  eventType!: ScheduleEventType;

  @ManyToOne(() => User, { nullable: true })
  responsible?: User;

  @ManyToOne(() => Wedding)
  wedding!: Wedding;

  @Column({ type: "text", nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
