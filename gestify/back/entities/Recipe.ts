import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { RecipeIngredient } from "./RecipeIngredient.ts";

@Entity("recipes")
export class Recipe {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ name: "yield_count", type: "int" })
  yield!: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  margin_ratio!: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  final_price!: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  unit_cost!: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  invisible_costs!: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  subtotal!: number;

  @OneToMany(() => RecipeIngredient, (ing) => ing.recipe)
  ingredients?: RecipeIngredient[];
}
