import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from "typeorm";
import { User } from "./User";
import { Wedding } from "./Wedding";
import { Checklist } from "./Checklist";
import { VendorBooking } from "./VendorBooking";

export type FileEntityType = "wedding" | "checklist" | "vendor";

@Entity()
export class FileAttachment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  fileName!: string;

  @Column()
  fileUrl!: string;

  @Column({ type: "bigint" })
  fileSize!: number;

  @Column({
    type: "simple-enum",
    enum: ["wedding", "checklist", "vendor"],
  })
  entityType!: FileEntityType;

  @Column({ nullable: true })
  entityId?: number;

  @ManyToOne(() => User)
  uploadedBy!: User;

  @ManyToOne(() => Wedding, (wedding) => wedding.files, { nullable: true })
  wedding?: Wedding;

  @ManyToOne(() => Checklist, (checklist) => checklist.files, { nullable: true })
  checklist?: Checklist;

  @ManyToOne(() => VendorBooking, (vendor) => vendor.files, { nullable: true })
  vendor?: VendorBooking;

  @CreateDateColumn()
  uploadedAt!: Date;
}
