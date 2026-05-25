import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export interface OrderItemJson {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

@Entity("orders")
export class Order {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  customer_name!: string;

  @Column({ type: "varchar", length: 64, default: "" })
  customer_phone!: string;

  @Column({ type: "varchar", length: 64 })
  type!: string;

  @Column({ type: "varchar", length: 64 })
  status!: string;

  @Column({ type: "jsonb", default: [] })
  items!: OrderItemJson[];

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  total_value!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  delivery_fee!: number;

  @Column({ type: "varchar", length: 16, default: "" })
  cep!: string;

  @Column({ type: "varchar", length: 255, default: "" })
  rua!: string;

  @Column({ type: "varchar", length: 128, default: "" })
  bairro!: string;

  @Column({ type: "varchar", length: 128, default: "" })
  cidade!: string;

  @Column({ type: "varchar", length: 8, default: "" })
  estado!: string;

  @Column({ type: "varchar", length: 32, default: "" })
  numero!: string;

  @Column({ type: "varchar", length: 255, default: "" })
  complemento!: string;

  @Column({ type: "varchar", length: 64, default: "" })
  estimated_time!: string;

  @Column({ type: "varchar", length: 128, default: "" })
  driver_name!: string;

  @Column({ type: "varchar", length: 32, default: "Próprio" })
  driver_type!: string;

  @Column({ type: "varchar", length: 64, default: "" })
  driver_phone!: string;

  @Column({ type: "text", default: "" })
  transport_obs!: string;

  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  created_at!: Date;
}
