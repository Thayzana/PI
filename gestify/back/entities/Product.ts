import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("products")
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 64 })
  sku!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "int", default: 0 })
  stock!: number;

  @Column({ type: "int", default: 0 })
  minimum!: number;

  @Column({ type: "varchar", length: 32 })
  expiration!: string;

  @Column({ type: "varchar", length: 24, default: "OK" })
  status!: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  price?: number;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "text", nullable: true })
  image_url?: string;

  @Column({ type: "varchar", length: 64, nullable: true })
  category?: string;

  @Column({ type: "boolean", default: false })
  is_promo!: boolean;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  promo_price?: number;

  @Column({ type: "varchar", length: 32, nullable: true })
  barcode?: string;

  @Column({ type: "varchar", length: 24, nullable: true, default: "Unidade" })
  unit_type?: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  wholesale_price?: number;
}
