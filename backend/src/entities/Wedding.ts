import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { User } from "./User";
import { Checklist } from "./Checklist";
import { VendorBooking } from "./VendorBooking";
import { Budget } from "./Budget";
import { FileAttachment } from "./FileAttachment";
import { ChangeLog } from "./ChangeLog";
import { ScheduleEvent } from "./ScheduleEvent";

export type WeddingTheme = "中式" | "西式" | "户外" | "海岛" | "极简";

@Entity()
export class Wedding {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  groomName!: string;

  @Column()
  brideName!: string;

  @Column({ type: "date" })
  weddingDate!: string;

  @Column()
  location!: string;

  @Column("decimal", { precision: 10, scale: 2 })
  totalBudget!: number;

  @Column({
    type: "simple-enum",
    enum: ["中式", "西式", "户外", "海岛", "极简"],
    default: "西式",
  })
  theme!: WeddingTheme;

  @Column({ nullable: true })
  description?: string;

  @OneToMany(() => User, (user) => user.wedding)
  users!: User[];

  @OneToMany(() => Checklist, (checklist) => checklist.wedding)
  checklists!: Checklist[];

  @OneToMany(() => VendorBooking, (vendor) => vendor.wedding)
  vendors!: VendorBooking[];

  @OneToMany(() => Budget, (budget) => budget.wedding)
  budgets!: Budget[];

  @OneToMany(() => FileAttachment, (file) => file.wedding)
  files!: FileAttachment[];

  @OneToMany(() => ChangeLog, (log) => log.wedding)
  changeLogs!: ChangeLog[];

  @OneToMany(() => ScheduleEvent, (event) => event.wedding)
  scheduleEvents!: ScheduleEvent[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
