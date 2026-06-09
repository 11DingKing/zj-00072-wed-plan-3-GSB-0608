import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from "typeorm";
import { User } from "./User";
import { Wedding } from "./Wedding";

export type ChangeEntityType = "wedding" | "budget" | "vendor" | "schedule";

@Entity()
export class ChangeLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: "simple-enum",
    enum: ["wedding", "budget", "vendor", "schedule"],
  })
  entityType!: ChangeEntityType;

  @Column()
  entityId!: number;

  @Column()
  fieldName!: string;

  @Column({ type: "text", nullable: true })
  oldValue?: string;

  @Column({ type: "text", nullable: true })
  newValue?: string;

  @ManyToOne(() => User)
  modifiedBy!: User;

  @ManyToOne(() => Wedding, (wedding) => wedding.changeLogs)
  wedding!: Wedding;

  @CreateDateColumn()
  modifiedAt!: Date;
}
