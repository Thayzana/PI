import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("promotions")
export class Promotion {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "varchar", length: 255 })
  subtitle!: string;

  @Column({ type: "varchar", length: 64 })
  type!: string;

  @Column({ type: "varchar", length: 32 })
  discount!: string;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  recovery!: number;

  @Column({ type: "varchar", length: 32, default: "Normal" })
  status!: string;

  @Column({ type: "int", default: 0 })
  active!: number;
}
