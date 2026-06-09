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
  | "化妆"
  | "接亲"
  | "仪式"
  | "拍照"
  | "宴客"
  | "敬酒"
  | "其他";

@Entity()
export class ScheduleEvent {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ type: "datetime" })
  startTime!: Date;

  @Column({ type: "datetime" })
  endTime!: Date;

  @Column({ nullable: true })
  personInCharge?: string;

  @Column({
    type: "simple-enum",
    enum: ["化妆", "接亲", "仪式", "拍照", "宴客", "敬酒", "其他"],
    default: "其他",
  })
  type!: ScheduleEventType;

  @ManyToOne(() => Wedding, (wedding) => wedding.scheduleEvents, { onDelete: "CASCADE" })
  wedding!: Wedding;

  @ManyToOne(() => User, { nullable: true })
  createdBy?: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
