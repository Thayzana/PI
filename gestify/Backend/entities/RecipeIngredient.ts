import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Recipe } from "./Recipe.ts";

@Entity("recipe_ingredients")
export class RecipeIngredient {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int" })
  recipe_id!: number;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "decimal", precision: 12, scale: 3 })
  amount!: number;

  @Column({ type: "varchar", length: 16 })
  unit!: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price!: number;

  @ManyToOne(() => Recipe, (recipe) => recipe.ingredients, { onDelete: "CASCADE" })
  @JoinColumn({ name: "recipe_id" })
  recipe?: Recipe;
}
