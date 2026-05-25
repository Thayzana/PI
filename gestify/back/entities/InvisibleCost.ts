import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("invisible_costs")
export class InvisibleCost {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 64, unique: true })
  key!: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  value!: number;
}
