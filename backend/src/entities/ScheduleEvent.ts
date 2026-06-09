import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from "typeorm";
import { Wedding } from "./Wedding";

export type ScheduleEventType =
  | "仪式"
  | "宴会"
  | "化妆"
  | "拍摄"
  | "接亲"
  | "交通"
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
  startTime!: string;

  @Column({ type: "datetime" })
  endTime!: string;

  @Column({ nullable: true })
  personInCharge?: string;

  @Column({
    type: "simple-enum",
    enum: ["仪式", "宴会", "化妆", "拍摄", "接亲", "交通", "其他"],
    default: "其他",
  })
  type!: ScheduleEventType;

  @ManyToOne(() => Wedding, (wedding) => wedding.scheduleEvents)
  wedding!: Wedding;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
