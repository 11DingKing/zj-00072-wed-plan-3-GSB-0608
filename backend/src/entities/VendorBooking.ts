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
import { Budget } from "./Budget";
import { FileAttachment } from "./FileAttachment";

export type PaymentStatus = "未付" | "定金已付" | "尾款已付" | "全额付清";
export type VendorType =
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
export class VendorBooking {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

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
  type!: VendorType;

  @Column({ nullable: true })
  contactPerson?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  address?: string;

  @Column("decimal", { precision: 10, scale: 2 })
  contractAmount!: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  paidAmount!: number;

  @Column({
    type: "simple-enum",
    enum: ["未付", "定金已付", "尾款已付", "全额付清"],
    default: "未付",
  })
  paymentStatus!: PaymentStatus;

  @Column({ default: false })
  isConfirmed!: boolean;

  @Column({ type: "date", nullable: true })
  bookingDate?: string;

  @Column({ type: "text", nullable: true })
  notes?: string;

  @ManyToOne(() => Wedding, (wedding) => wedding.vendors)
  wedding!: Wedding;

  @ManyToOne(() => Budget, (budget) => budget.vendors, { nullable: true })
  budget?: Budget;

  @OneToMany(() => Checklist, (checklist) => checklist.vendor)
  checklists!: Checklist[];

  @OneToMany(() => FileAttachment, (file) => file.vendor)
  files!: FileAttachment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
