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
  | "迎亲"
  | "敬酒"
  | "迎宾"
  | "合影"
  | "晚宴"
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
  responsiblePerson?: string;

  @Column({
    type: "simple-enum",
    enum: ["仪式", "迎亲", "敬酒", "迎宾", "合影", "晚宴", "其他"],
    default: "其他",
  })
  type!: ScheduleEventType;

  @Column({ nullable: true, type: "text" })
  description?: string;

  @ManyToOne(() => Wedding, (wedding) => wedding.scheduleEvents)
  wedding!: Wedding;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
