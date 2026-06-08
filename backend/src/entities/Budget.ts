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
import { VendorBooking } from "./VendorBooking";

export type BudgetCategory =
  | "场地"
  | "婚庆"
  | "摄影"
  | "摄像"
  | "婚纱"
  | "化妆"
  | "主持"
  | "婚车"
  | "喜糖"
  | "请柬"
  | "蜜月"
  | "其他";

@Entity()
export class Budget {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: "simple-enum",
    enum: [
      "场地",
      "婚庆",
      "摄影",
      "摄像",
      "婚纱",
      "化妆",
      "主持",
      "婚车",
      "喜糖",
      "请柬",
      "蜜月",
      "其他",
    ],
  })
  category!: BudgetCategory;

  @Column("decimal", { precision: 10, scale: 2 })
  budgetLimit!: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  actualSpent!: number;

  @Column({ nullable: true })
  notes?: string;

  @ManyToOne(() => Wedding, (wedding) => wedding.budgets)
  wedding!: Wedding;

  @OneToMany(() => VendorBooking, (vendor) => vendor.budget)
  vendors!: VendorBooking[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
