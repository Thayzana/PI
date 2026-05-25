import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("sales_history")
export class SalesHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 16 })
  day!: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  revenue!: number;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  profit!: number;
}
