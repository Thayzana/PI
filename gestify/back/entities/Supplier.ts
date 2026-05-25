import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("suppliers")
export class Supplier {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 512 })
  contact!: string;

  @Column({ type: "varchar", length: 128 })
  category!: string;

  @Column({ type: "int", default: 1 })
  active!: number;

  @Column({ type: "jsonb", default: [] })
  items!: string[];
}
