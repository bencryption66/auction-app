# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_10_16_000406) do
  create_table "asset_categories", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "asset_id", null: false
    t.bigint "category_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["asset_id"], name: "index_asset_categories_on_asset_id"
    t.index ["category_id"], name: "index_asset_categories_on_category_id"
  end

  create_table "assets", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "name"
    t.bigint "collection_id", null: false
    t.string "token_id"
    t.datetime "expires_at"
    t.datetime "registered_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["collection_id"], name: "index_assets_on_collection_id"
  end

  create_table "auctions", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "asset_id", null: false
    t.string "creator"
    t.datetime "started_at"
    t.datetime "ends_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "nft_address"
    t.string "token_id"
    t.string "domain_name"
    t.string "seller"
    t.string "start_price_usd"
    t.string "start_time"
    t.string "duration_days"
    t.string "fee_bps"
    t.boolean "settled", default: false
    t.string "buyer"
    t.string "sale_price_eth"
    t.string "token_standard"
    t.string "contract_address"
    t.index ["asset_id"], name: "index_auctions_on_asset_id"
    t.index ["nft_address"], name: "index_auctions_on_nft_address"
    t.index ["seller"], name: "index_auctions_on_seller"
    t.index ["settled"], name: "index_auctions_on_settled"
    t.index ["token_id"], name: "index_auctions_on_token_id"
  end

  create_table "categories", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "name"
    t.string "slug"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "collections", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "name"
    t.string "contract_address"
    t.string "slug"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  add_foreign_key "asset_categories", "assets"
  add_foreign_key "asset_categories", "categories"
  add_foreign_key "assets", "collections"
  add_foreign_key "auctions", "assets"
end
